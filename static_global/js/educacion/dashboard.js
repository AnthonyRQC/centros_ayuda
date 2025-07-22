// static/js/educacion/dashboard.js
// Orquestador para el dashboard de EDUCACIÓN.

// Importamos los MISMOS módulos comunes. ¡No se cambia nada aquí!
import { initMap, actualizarMapa } from '../common_modules/map.js';
import { initCharts, actualizarGraficos } from '../common_modules/charts.js'; // Lo adaptaremos
import { initUI, actualizarCards } from '../common_modules/ui.js';

// --- ADAPTACIÓN DE CHARTS.JS ---
// Como charts.js fue hecho para los 4 gráficos de hospitales, crearemos
// una función de actualización más simple aquí que solo llame a los gráficos que existen.
function actualizarGraficosEducacion(filtros) {
    actualizarGraficoDependencia(filtros);
    // Si agregas más gráficos, llama a sus funciones de actualización aquí.
}

// Se ejecuta cuando el DOM está completamente cargado.
$(document).ready(function () {
    // 1. Inicializa la UI y le pasa la función de callback.
    initUI(actualizarContenido);

    // 2. Inicializa el mapa.
    initMap();

    // 3. Inicializa los contenedores de los gráficos que existen en este dashboard.
    initGraficosEducacion();

    // 4. Carga inicial de datos.
    actualizarContenido();
});

/**
 * Función central que se llama cada vez que un filtro cambia.
 */
function actualizarContenido() {
    const selectors = window.dashboardConfig.elementSelectors.filters;
    const filtros = {
        'distritos[]': $(selectors[0]).val(),
        'dependencias[]': $(selectors[1]).val(),
        'subsistemas[]': $(selectors[2]).val()
    };

    actualizarMapa(filtros);
    actualizarGraficosEducacion(filtros);
    actualizarCards(filtros);
}

// --- LÓGICA DE GRÁFICOS ESPECÍFICA DE EDUCACIÓN ---

let chartDependencia;

function initGraficosEducacion() {
    const chartContainer = document.getElementById('grafico-dependencia');
    if (chartContainer) {
        chartDependencia = echarts.init(chartContainer);
    }
}

function actualizarGraficoDependencia(filtros) {
    if (!chartDependencia) return;

    $.ajax({
        url: window.dashboardConfig.apiUrls.graficoDependencia,
        data: filtros,
        dataType: 'json',
        success: response => {
            const settings = window.dashboardConfig.chartSettings.dependencia;
            const option = {
                title: { text: settings.title, left: 'center' },
                tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
                legend: { orient: 'vertical', left: 'left', top: 'bottom' },
                series: [{
                    name: 'Dependencia',
                    type: 'pie',
                    radius: '60%',
                    data: response,
                    emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
                    itemStyle: {
                        color: params => settings.colorMappings[params.name] || settings.colorMappings['default']
                    }
                }]
            };
            chartDependencia.setOption(option);
        }
    });
}
