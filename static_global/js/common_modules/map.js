// static/js/common_modules/map.js
// Módulo REUTILIZABLE para la gestión de mapas Leaflet.

const initialView = { lat: -16.5000, lng: -68.1993, zoom: 11 };
let map;
let marcadores;
let distritosLayer;
let highlightedLayer = null;
const distritosCentroids = {};

function obtenerIcono(valor) {
    const mappings = window.dashboardConfig.staticUrls.iconMappings;
    return mappings[valor] || mappings['default'];
}

export function initMap() {
    map = L.map('map', { zoomControl: false }).setView([initialView.lat, initialView.lng], initialView.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    marcadores = L.markerClusterGroup({
        disableClusteringAtZoom: 13,
        maxClusterRadius: 20
    });
    map.addLayer(marcadores);

    const defaultStyle = { color: "#87CEEB", weight: 2, opacity: 0.8, fillOpacity: 0.2 };
    const highlightStyle = { color: '#E14434', weight: 4, opacity: 1, fillOpacity: 0.3 };

    distritosLayer = L.geoJSON(window.dashboardConfig.data.distritosGeojson, {
        style: defaultStyle,
        onEachFeature: (feature, layer) => {
            if (feature.properties && feature.properties.distrito && feature.properties.centroid) {
                distritosCentroids[feature.properties.distrito] = [feature.properties.centroid[1], feature.properties.centroid[0]];
            }
        }
    }).addTo(map);

    addCustomControls(defaultStyle, highlightStyle);
    addLegend(); // Esta función ahora es dinámica

    dibujarMarcadores(window.dashboardConfig.data.instituciones);
}

export function dibujarMarcadores(instituciones) {
    marcadores.clearLayers();
    const nuevosMarcadores = [];
    const iconField = window.dashboardConfig.fieldMappings.iconField;

    instituciones.forEach(institucion => {
        if (!institucion.latitud || !institucion.longitud || isNaN(institucion.latitud) || isNaN(institucion.longitud)) return;
        
        const customIcon = L.icon({
            iconUrl: obtenerIcono(institucion[iconField]),
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
            shadowUrl: window.dashboardConfig.staticUrls.markerShadow, shadowSize: [41, 41]
        });
        
        // Usamos el ID correcto (id_unidad para educación, id para hospitales)
        const id = institucion.id_unidad || institucion.id;
        const popupContent = `<div style="text-align: center;"><b>${institucion.nombre_establecimiento || institucion.nombre_unidad}</b><br>${institucion[iconField]}<br><br><button class="btn btn-primary btn-sm ver-mas-btn" data-id="${id}">Ver más</button></div>`;
        const marker = L.marker([institucion.latitud, institucion.longitud], { icon: customIcon }).bindPopup(popupContent);
        nuevosMarcadores.push(marker);
    });
    marcadores.addLayers(nuevosMarcadores);
}

export function actualizarMapa(filtros) {
    $.ajax({
        url: window.dashboardConfig.apiUrls.filtrarInstituciones,
        data: filtros,
        dataType: 'json',
        success: data => dibujarMarcadores(data)
    });
}

// --- Funciones auxiliares para controles y leyenda ---
function addCustomControls(defaultStyle, highlightStyle) {
    // ... (esta función no necesita cambios)
    const zoomControl = L.control({ position: 'topleft' });
    zoomControl.onAdd = map => {
        const container = L.DomUtil.create('div', 'leaflet-zoom-control-container');
        const select = L.DomUtil.create('select', 'form-control', container);
        select.id = 'district-zoom-select';
        select.innerHTML = '<option value="" disabled selected>Acercar a distrito</option>';
        window.dashboardConfig.data.listaDistritosCompleta.forEach(d => {
            select.innerHTML += `<option value="${d}">Distrito ${d}</option>`;
        });
        L.DomEvent.disableClickPropagation(container);
        select.onchange = function () {
            const distritoId = this.value;
            if (highlightedLayer) highlightedLayer.setStyle(defaultStyle);
            if (distritoId) {
                map.setView(distritosCentroids[distritoId], 14);
                distritosLayer.eachLayer(layer => {
                    if (layer.feature.properties.distrito == distritoId) {
                        layer.setStyle(highlightStyle);
                        layer.bringToFront();
                        highlightedLayer = layer;
                    }
                });
            }
        };
        return container;
    };
    zoomControl.addTo(map);

    const customZoomControl = L.control({ position: 'topleft' });
    customZoomControl.onAdd = map => {
        const container = L.DomUtil.create('div', 'custom-zoom-container');
        const zoomContainer = L.DomUtil.create('div', 'leaflet-bar leaflet-control', container);
        const zoomInButton = L.DomUtil.create('a', 'leaflet-control-zoom-in', zoomContainer);
        zoomInButton.href = '#'; zoomInButton.title = 'Acercar'; zoomInButton.innerHTML = '+';
        const zoomOutButton = L.DomUtil.create('a', 'leaflet-control-zoom-out', zoomContainer);
        zoomOutButton.href = '#'; zoomOutButton.title = 'Alejar'; zoomOutButton.innerHTML = '&#x2212;';
        const resetContainer = L.DomUtil.create('div', 'leaflet-bar leaflet-control custom-reset-button', container);
        const resetButton = L.DomUtil.create('a', '', resetContainer);
        resetButton.href = '#'; resetButton.title = 'Reiniciar vista'; resetButton.innerHTML = '&#x21BA;';
        resetButton.style.fontSize = '1.4em';
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(zoomInButton, 'click', () => map.zoomIn());
        L.DomEvent.on(zoomOutButton, 'click', () => map.zoomOut());
        L.DomEvent.on(resetButton, 'click', () => {
            map.setView([initialView.lat, initialView.lng], initialView.zoom);
            if (highlightedLayer) highlightedLayer.setStyle(defaultStyle);
            $('#district-zoom-select').val("");
        });
        return container;
    };
    customZoomControl.addTo(map);
}

/**
 * ✅ CAMBIO: Esta función ahora es completamente dinámica.
 * Construye la leyenda del mapa basándose en la configuración proporcionada
 * en `window.dashboardConfig`.
 */
function addLegend() {
    const legendConfig = window.dashboardConfig.legendSettings;
    // Si no hay configuración para la leyenda, no hace nada.
    if (!legendConfig) return;

    const legend = L.control({ position: 'topright' });
    legend.onAdd = map => {
        const div = L.DomUtil.create('div', 'info legend');
        const iconMappings = window.dashboardConfig.staticUrls.iconMappings;
        
        let listItems = '';
        // Itera sobre el mapeo de iconos para crear cada línea de la leyenda
        for (const key in iconMappings) {
            // Ignoramos la clave 'default' para que no aparezca en la leyenda
            if (key !== 'default') {
                listItems += `<li><img src="${iconMappings[key]}"> ${key}</li>`;
            }
        }

        // Usa el título de la configuración y la lista de items generada
        div.innerHTML = `
            <h5 style="margin-top:0;margin-bottom:10px;">${legendConfig.title}</h5>
            <ul style="list-style:none;padding-left:0;margin:0;">
                ${listItems}
            </ul>`;
            
        $(div).find('li').css({ display: 'flex', alignItems: 'center', marginBottom: '7px' });
        $(div).find('img').css({ width: '22px', height: '22px', marginRight: '9px' });
        return div;
    };
    legend.addTo(map);
}
