// static/js/hospitales/dashboard.js
// Archivo principal que ORQUESTA los módulos para el dashboard de hospitales.

// Importamos los módulos compartidos desde la carpeta común.
import { initMap, actualizarMapa } from '../common_modules/map.js';
import { initCharts, actualizarGraficos } from '../common_modules/charts.js';
import { initUI, actualizarCards } from '../common_modules/ui.js';

// Se ejecuta cuando el DOM está completamente cargado.
$(document).ready(function () {
    
    // 1. Inicializa los componentes de la UI y le pasa la función de callback.
    initUI(actualizarContenido);

    // 2. Inicializa el mapa de Leaflet.
    initMap();

    // 3. Inicializa las instancias de los gráficos de ECharts.
    initCharts();

    // 4. Realiza la primera carga de datos para los componentes dinámicos.
    actualizarContenido();
});

/**
 * Función central que se llama cada vez que un filtro cambia.
 * Recopila los valores actuales de los filtros y actualiza todos los componentes.
 */
function actualizarContenido() {
    // ✅ CAMBIO: Lee los selectores de los filtros desde la config para ser genérico.
    const filtroSelectors = window.dashboardConfig.elementSelectors.filters;
    const filtros = {
        'distritos[]': $(filtroSelectors[0]).val(),
        'niveles[]': $(filtroSelectors[1]).val(),
        'subsectores[]': $(filtroSelectors[2]).val()
    };

    actualizarMapa(filtros);
    actualizarGraficos(filtros);
    actualizarCards(filtros);
}
