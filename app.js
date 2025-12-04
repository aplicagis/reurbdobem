// Inicialização do mapa Leaflet

// Define a coordenada inicial e o nível de zoom.
// Coordenadas iniciais: Lat: -27.010564, Lng: -48.601370 (Balneário Camboriú - SC, região do projeto)
const initialCenter = [-27.010564, -48.60137];
const initialZoom = 14;

// Mapa base 1: Esri World Imagery (imagem de satélite)
// Fonte: ArcGIS Online (uso comum em webgis)
const esriSat = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 19,
  }
);

// Mapa base 2: OpenStreetMap (informação territorial / vias / bairros)
const osmTerritorial = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }
);

// Cria o mapa com o basemap padrão (satélite, neste exemplo)
const map = L.map("map", {
  center: initialCenter,
  zoom: initialZoom,
  layers: [esriSat],
  zoomControl: true,
});

// Dicionário de mapas base para o controle de camadas
const baseMaps = {
  "Imagem de Satélite (Esri)": esriSat,
  "Mapa Territorial (OSM)": osmTerritorial,
};

// Dicionário para camadas temáticas (será preenchido dinamicamente)
const overlayMaps = {};

// Adiciona o controle de camadas (basemaps e overlays)
// (criado aqui para poder ser usado depois ao adicionar overlays via fetch)
const layersControl = L.control.layers(baseMaps, overlayMaps, {
  position: "topright",
}).addTo(map);

// Lista de arquivos GeoJSON disponíveis na pasta do projeto
// (mesma pasta do index.html / app.js)
const geojsonFiles = [
  { file: "app.geojson", label: "APP" },
  { file: "app_uso.geojson", label: "APP - Uso" },
  { file: "massa_dagua.geojson", label: "Massa d'Água" },
  { file: "rio_duplos.geojson", label: "Rios (Duplos)" },
  { file: "rio_simples.geojson", label: "Rios (Simples)" },
  { file: "nascentes_pt.geojson", label: "Nascentes (Pontos)" },
  { file: "nascentes.geojson", label: "Nascentes (Polígonos/Linhas)" },
  {
    file: "uso_ocupacao_SC_4202008_USO.geojson",
    label: "Uso e Ocupação - Município 4202008",
  },
  { file: "curso_dagua_bc.geojson", label: "Cursos d'Água - Bal. Camboriú" },
  { file: "massa_dagua_bc.geojson", label: "Massas d'Água - Bal. Camboriú" },
  { file: "geomorfologia.geojson", label: "Geomorfologia" },
  { file: "geologia.geojson", label: "Geologia" },
  { file: "vegetacao.geojson", label: "Vegetação" },
  { file: "pedologia.geojson", label: "Pedologia (Solos)" },
  {
    file: "balneario_camboriu_santacatarina.geojson",
    label: "Balneário Camboriú - Limite Municipal",
  },
  { file: "curva-nivel-10m.geojson", label: "Curvas de Nível - 10m" },
  { file: "municipios_santacatarina.geojson", label: "Municípios - SC" },
  { file: "estados_brasil.geojson", label: "Estados do Brasil" },
  { file: "nui_vilafortaleza.geojson", label: "Núcleo Urbano Informal - Vila Fortaleza" },
];

// Referência para a camada da NUI Vila Fortaleza (para controle de estilo/opacidade)
let nuiLayer = null;

// Valor padrão de opacidade da NUI
let nuiOpacity = 0.6;

// Estilo "genérico" de fallback
function getDefaultStyle() {
  return {
    color: "#0052cc",
    weight: 1,
    fillColor: "#3388ff",
    fillOpacity: 0.3,
  };
}

// Estilos derivados dos arquivos SLD (por camada)
function getStyleForLayer(label, feature) {
  // APP (app.sld)
  if (label === "APP") {
    return {
      color: "#232323",
      weight: 1,
      fillColor: "#9abe97",
      fillOpacity: 0.6,
    };
  }

  // APP - Uso (app_uso.sld)
  if (label === "APP - Uso") {
    return {
      color: "#232323",
      weight: 1,
      fillColor: "#80d899",
      fillOpacity: 0.6,
    };
  }

  // Massa d'Água (massa_dagua.sld e massa_dagua_bc.sld assumido igual)
  if (
    label === "Massa d'Água" ||
    label === "Massas d'Água - Bal. Camboriú"
  ) {
    return {
      color: "#232323",
      weight: 1,
      fillColor: "#aadeff",
      fillOpacity: 0.7,
    };
  }

  // Rios (simples) - linha azul (rio_simples.sld)
  if (label === "Rios (Simples)" || label === "Cursos d'Água - Bal. Camboriú") {
    return {
      color: "#487bb6",
      weight: 2,
    };
  }

  // Rios (Duplos) - polígonos (rio_duplos.sld)
  if (label === "Rios (Duplos)") {
    return {
      color: "#232323",
      weight: 1,
      fillColor: "#71c4e8",
      fillOpacity: 0.7,
    };
  }

  // Nascentes (Polígonos/Linhas) - nascentes.sld
  if (label === "Nascentes (Polígonos/Linhas)") {
    return {
      color: "#232323",
      weight: 1,
      fillColor: "#a6b8f3",
      fillOpacity: 0.7,
    };
  }

  // Uso e Ocupação - categórico por CLASSE_USO (uso_ocupacao_SC_4202008_USO.sld)
  if (label === "Uso e Ocupação - Município 4202008") {
    const classe = feature?.properties?.CLASSE_USO;
    const base = {
      color: "#232323",
      weight: 1,
      fillOpacity: 0.7,
    };

    switch (classe) {
      case "água":
        return { ...base, fillColor: "#01fff2" };
      case "área antropizada":
        return { ...base, fillColor: "#ffed89" };
      case "área edificada":
        return { ...base, fillColor: "#dc515f" };
      case "formação florestal":
        return { ...base, fillColor: "#60cc64" };
      case "silvicultura":
        return { ...base, fillColor: "#d6da5e" };
      default:
        return { ...base, fillColor: "#cccccc" };
    }
  }

  // Municípios - SC (municipios_santacatarina.sld - regra genérica)
  if (label === "Municípios - SC") {
    return {
      color: "#ffffff",
      opacity: 0.5,
      weight: 1,
      fillColor: "#fa4b3c",
      fillOpacity: 0.2,
    };
  }

  // Estados do Brasil (estados_brasil.sld - apenas contorno vermelho)
  if (label === "Estados do Brasil") {
    return {
      color: "#ff0003",
      weight: 1,
      fillOpacity: 0,
    };
  }

  // Geomorfologia - categórico por campo "legenda" (geomorfologia.sld)
  if (label === "Geomorfologia") {
    const legenda = feature?.properties?.legenda;
    const base = {
      color: "#232323",
      weight: 1,
      fillOpacity: 0.7,
    };

    switch (legenda) {
      case "1Planícies Litorâneas":
        return { ...base, fillColor: "#42dfe2" };
      case "4Serras do Leste Catarinense":
        return { ...base, fillColor: "#9fdc67" };
      case "6Corpo d´água continental":
        return { ...base, fillColor: "#7923c9" };
      default:
        return { ...base, fillColor: "#cccccc" };
    }
  }

  // Geologia - categórico por campo "nm_unidade" (geologia.sld)
  if (label === "Geologia") {
    const unidade = feature?.properties?.nm_unidade;
    const base = {
      color: "#232323",
      weight: 1,
      fillOpacity: 0.7,
    };

    switch (unidade) {
      case "Botuverá":
        return { ...base, fillColor: "#e14ddf" };
      case "Corpo d'água continental":
        return { ...base, fillColor: "#da4c79" };
      case "Depósitos Aluvionares Holocênicos":
        return { ...base, fillColor: "#57c9c9" };
      case "Depósitos Colúvio-aluvionares":
        return { ...base, fillColor: "#d98051" };
      case "Depósitos Litorâneos Holocênicos":
        return { ...base, fillColor: "#1d5ce4" };
      case "Guabiruba":
        return { ...base, fillColor: "#d5d574" };
      case "Luiz Alves":
        return { ...base, fillColor: "#7cd64f" };
      case "Valsungana":
        return { ...base, fillColor: "#59cd80" };
      default:
        return { ...base, fillColor: "#cccccc" };
    }
  }

  // Vegetação - categórico por campo "legenda" (vegetacao.sld)
  if (label === "Vegetação") {
    const legenda = feature?.properties?.legenda;
    const base = {
      color: "#232323",
      weight: 1,
      fillOpacity: 0.7,
    };

    switch (legenda) {
      case "1Ds - Floresta Ombrófila Densa Submontana":
        return { ...base, fillColor: "#ea4f16" };
      case "3Ag - Agropecuária":
        return { ...base, fillColor: "#3950e5" };
      case "3Iu - Influência urbana":
        return { ...base, fillColor: "#65e0b7" };
      case "5Corpo d'água continental":
        return { ...base, fillColor: "#91c852" };
      default:
        return { ...base, fillColor: "#cccccc" };
    }
  }

  // Pedologia - categórico por campo "legenda" (pedologia.sld)
  if (label === "Pedologia (Solos)") {
    const legenda = feature?.properties?.legenda;
    const base = {
      color: "#232323",
      weight: 1,
      fillOpacity: 0.7,
    };

    switch (legenda) {
      case "Área Urbana":
        return { ...base, fillColor: "#ff1a0b" };
      case "Corpo d'água continental":
        return { ...base, fillColor: "#4223dd" };
      case "CYbd - Cambissolo Flúvico Tb Distrófico":
        return { ...base, fillColor: "#e87d65" };
      case "ESKo - Espodossolo Ferri-Humilúvico Órtico":
        return { ...base, fillColor: "#abc924" };
      case "PVAa - Argissolo Vermelho-Amarelo Alumínico":
        return { ...base, fillColor: "#2cadca" };
      default:
        return { ...base, fillColor: "#cccccc" };
    }
  }

  // Demais camadas usam o estilo padrão
  return getDefaultStyle();
}

// Função para popup padrão com propriedades do GeoJSON
function onEachFeature(feature, layer) {
  if (feature && feature.properties) {
    let html = "<strong>Atributos</strong><br>";
    html += "<table style='border-collapse:collapse;font-size:12px;'>";
    Object.entries(feature.properties).forEach(([key, value]) => {
      html += `<tr><td style="border:1px solid #ccc;padding:2px 4px;"><strong>${key}</strong></td>`;
      html += `<td style="border:1px solid #ccc;padding:2px 4px;">${
        value ?? ""
      }</td></tr>`;
    });
    html += "</table>";
    layer.bindPopup(html);
  }
}

// Legendas temáticas (exibidas quando as camadas estiverem ativas)
const usoOcupacaoLegend = L.control({ position: "bottomright" });
usoOcupacaoLegend.onAdd = () => {
  const div = L.DomUtil.create("div", "map-legend");
  div.innerHTML = `
    <div class="legend-title">Uso e Ocupação</div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#01fff2;"></span>
      <span>Água</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#ffed89;"></span>
      <span>Área antropizada</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#dc515f;"></span>
      <span>Área edificada</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#60cc64;"></span>
      <span>Formação florestal</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#d6da5e;"></span>
      <span>Silvicultura</span>
    </div>
  `;
  return div;
};

const geomorfologiaLegend = L.control({ position: "bottomright" });
geomorfologiaLegend.onAdd = () => {
  const div = L.DomUtil.create("div", "map-legend");
  div.innerHTML = `
    <div class="legend-title">Geomorfologia</div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#42dfe2;"></span>
      <span>Planícies Litorâneas</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#9fdc67;"></span>
      <span>Serras do Leste Catarinense</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#7923c9;"></span>
      <span>Corpo d'água continental</span>
    </div>
  `;
  return div;
};

const geologiaLegend = L.control({ position: "bottomright" });
geologiaLegend.onAdd = () => {
  const div = L.DomUtil.create("div", "map-legend");
  div.innerHTML = `
    <div class="legend-title">Geologia</div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#e14ddf;"></span>
      <span>Botuverá</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#da4c79;"></span>
      <span>Corpo d'água continental</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#57c9c9;"></span>
      <span>Depósitos Aluvionares Holocênicos</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#d98051;"></span>
      <span>Depósitos Colúvio-aluvionares</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#1d5ce4;"></span>
      <span>Depósitos Litorâneos Holocênicos</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#d5d574;"></span>
      <span>Guabiruba</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#7cd64f;"></span>
      <span>Luiz Alves</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#59cd80;"></span>
      <span>Valsungana</span>
    </div>
  `;
  return div;
};

const vegetacaoLegend = L.control({ position: "bottomright" });
vegetacaoLegend.onAdd = () => {
  const div = L.DomUtil.create("div", "map-legend");
  div.innerHTML = `
    <div class="legend-title">Vegetação</div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#ea4f16;"></span>
      <span>Floresta Ombrófila Densa Submontana</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#3950e5;"></span>
      <span>Agropecuária</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#65e0b7;"></span>
      <span>Influência urbana</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#91c852;"></span>
      <span>Corpo d'água continental</span>
    </div>
  `;
  return div;
};

const pedologiaLegend = L.control({ position: "bottomright" });
pedologiaLegend.onAdd = () => {
  const div = L.DomUtil.create("div", "map-legend");
  div.innerHTML = `
    <div class="legend-title">Solos (Pedologia)</div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#ff1a0b;"></span>
      <span>Área Urbana</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#4223dd;"></span>
      <span>Corpo d'água continental</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#e87d65;"></span>
      <span>CYbd - Cambissolo Flúvico Tb Distrófico</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#abc924;"></span>
      <span>ESKo - Espodossolo Ferri-Humilúvico Órtico</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color:#2cadca;"></span>
      <span>PVAa - Argissolo Vermelho-Amarelo Alumínico</span>
    </div>
  `;
  return div;
};

// Carrega todas as camadas GeoJSON da lista
geojsonFiles.forEach(({ file, label }) => {
  fetch(file)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erro ao carregar ${file}: ${response.statusText}`);
      }
      return response.text();
    })
    .then((text) => {
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn(
          `Arquivo ${file} não é um JSON válido ou está incompleto. Camada será ignorada.`,
          e
        );
        return;
      }

      const layerOptions = {
        onEachFeature,
      };

      // Camada de pontos - Nascentes (Pontos), com estilo de nascentes_pt.sld
      if (label === "Nascentes (Pontos)") {
        layerOptions.pointToLayer = (feature, latlng) =>
          L.circleMarker(latlng, {
            radius: 4, // próximo do Size 7 do SLD em pixels
            color: "#232323",
            weight: 0.5,
            fillColor: "#0043ff",
            fillOpacity: 1,
          });
      } else {
        // Demais camadas: estilo baseado no SLD / camada
        layerOptions.style = (feature) => getStyleForLayer(label, feature);
      }

      const layer = L.geoJSON(data, layerOptions);

      // Se for a camada da NUI Vila Fortaleza, aplica estilo vermelho, guarda referência
      if (label === "Núcleo Urbano Informal - Vila Fortaleza") {
        nuiLayer = layer;
        nuiLayer.setStyle({
          color: "#ff0000",
          weight: 2,
          fillColor: "#ff0000",
          fillOpacity: nuiOpacity,
          opacity: nuiOpacity,
        });
        // Ativa a camada da NUI por padrão ao abrir o mapa
        nuiLayer.addTo(map);
      }

      // Adiciona ao dicionário de overlays e ao mapa de controle
      overlayMaps[label] = layer;
      layersControl.addOverlay(layer, label);

      // Garante que o controle de opacidade da NUI seja inserido
      // depois que o controle de camadas tiver os overlays renderizados
      setTimeout(attachNuiOpacityControl, 0);
    })
    .catch((err) => {
      console.error(`Erro ao processar ${file}:`, err);
    });
});

// Exemplo opcional: exibir coordenadas ao clicar no mapa
map.on("click", (e) => {
  const { lat, lng } = e.latlng;
  const text = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
  L.popup()
    .setLatLng(e.latlng)
    .setContent(`<strong>Coordenadas</strong><br>${text}`)
    .openOn(map);
});

// Cria um controle de opacidade dentro do controle de camadas,
// logo abaixo da camada "Núcleo Urbano Informal - Vila Fortaleza"
function attachNuiOpacityControl() {
  const overlaysContainer = document.querySelector(
    ".leaflet-control-layers-overlays"
  );
  if (!overlaysContainer) return;

  const labels = Array.from(overlaysContainer.querySelectorAll("label"));
  const nuiLabel = labels.find((lbl) =>
    lbl.textContent.includes("Núcleo Urbano Informal - Vila Fortaleza")
  );
  if (!nuiLabel) return;

  // Evita criar duplicado
  if (overlaysContainer.querySelector(".nui-opacity-control")) return;

  const wrapper = document.createElement("div");
  wrapper.className = "nui-opacity-control";
  wrapper.innerHTML = `
    <label style="font-size: 11px; display:block; margin-top:4px;">
      Opacidade NUI:
      <span class="nui-opacity-value">${nuiOpacity.toFixed(1)}</span>
    </label>
    <input
      type="range"
      min="0"
      max="1"
      step="0.1"
      value="${nuiOpacity}"
      class="nui-opacity-slider"
      style="width: 100%;"
    />
  `;

  nuiLabel.insertAdjacentElement("afterend", wrapper);

  const slider = wrapper.querySelector(".nui-opacity-slider");
  const valueSpan = wrapper.querySelector(".nui-opacity-value");

  slider.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    nuiOpacity = value;

    if (valueSpan) {
      valueSpan.textContent = value.toFixed(1);
    }

    if (nuiLayer) {
      nuiLayer.setStyle({
        fillOpacity: nuiOpacity,
        opacity: nuiOpacity,
      });
    }
  });
}

// Tenta anexar o controle assim que o DOM estiver pronto e novamente
// após um pequeno atraso para garantir que o controle de camadas foi renderizado
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(attachNuiOpacityControl, 500);

  // Mostra/esconde as legendas temáticas conforme as camadas são ligadas/desligadas
  map.on("overlayadd", (e) => {
    if (e.layer === overlayMaps["Uso e Ocupação - Município 4202008"]) {
      usoOcupacaoLegend.addTo(map);
    } else if (e.layer === overlayMaps["Geomorfologia"]) {
      geomorfologiaLegend.addTo(map);
    } else if (e.layer === overlayMaps["Geologia"]) {
      geologiaLegend.addTo(map);
    } else if (e.layer === overlayMaps["Vegetação"]) {
      vegetacaoLegend.addTo(map);
    } else if (e.layer === overlayMaps["Pedologia (Solos)"]) {
      pedologiaLegend.addTo(map);
    }
  });

  map.on("overlayremove", (e) => {
    if (e.layer === overlayMaps["Uso e Ocupação - Município 4202008"]) {
      usoOcupacaoLegend.remove();
    } else if (e.layer === overlayMaps["Geomorfologia"]) {
      geomorfologiaLegend.remove();
    } else if (e.layer === overlayMaps["Geologia"]) {
      geologiaLegend.remove();
    } else if (e.layer === overlayMaps["Vegetação"]) {
      vegetacaoLegend.remove();
    } else if (e.layer === overlayMaps["Pedologia (Solos)"]) {
      pedologiaLegend.remove();
    }
  });
});
// Controlo de recolher/expandir a sidebar
const sidebarToggleButton = document.getElementById("sidebar-toggle");
const appMainElement = document.querySelector(".app-main");

if (sidebarToggleButton && appMainElement) {
  sidebarToggleButton.addEventListener("click", () => {
    const collapsed = appMainElement.classList.toggle("sidebar-collapsed");
    sidebarToggleButton.innerHTML = collapsed
      ? "&raquo; expandir painel"
      : "&laquo; recolher painel";
  });
}
