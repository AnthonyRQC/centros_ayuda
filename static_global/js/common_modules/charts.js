// static/js/common_modules/charts.js
// Módulo REUTILIZABLE para la creación y gestión de todos los gráficos con ECharts.

// Variables para mantener las instancias de los gráficos
let chartDistritos, chartBurbujasNivel, chartSubsector, chartComparativa;
let heatmapNivel, heatmapSubsector;

/**
 * Inicializa todas las instancias de los gráficos principales del dashboard
 * y configura los listeners para redimensionarlos correctamente.
 */
export function initCharts() {
    // Inicializa los gráficos de las pestañas
    chartDistritos = echarts.init(document.getElementById('grafico-distritos'));
    chartBurbujasNivel = echarts.init(document.getElementById('grafico-burbujas-nivel'));
    chartSubsector = echarts.init(document.getElementById('grafico-subsector'));
    chartComparativa = echarts.init(document.getElementById('grafico-comparativa'));

    // Listener para redimensionar los gráficos cuando se cambia de pestaña
    $('a[data-toggle="tab"]').on('shown.bs.tab', e => {
        const targetId = e.target.id;
        if (targetId === 'distrito-tab' && chartDistritos) chartDistritos.resize();
        if (targetId === 'nivel-tab' && chartBurbujasNivel) chartBurbujasNivel.resize();
        if (targetId === 'subsector-tab' && chartSubsector) chartSubsector.resize();
        if (targetId === 'comp-tab' && chartComparativa) chartComparativa.resize();
    });

    // Listener para redimensionar los gráficos de los modales al cambiar el tamaño de la ventana
    $(window).on('resize', () => {
        if (heatmapNivel) heatmapNivel.resize();
        if (heatmapSubsector) heatmapSubsector.resize();
    });
}

/**
 * Función principal que actualiza todos los gráficos del dashboard
 * basándose en los filtros proporcionados.
 * @param {object} filtros - Objeto con los filtros seleccionados.
 */
export function actualizarGraficos(filtros) {
    actualizarGraficoDistritos(filtros);
    actualizarGraficoBurbujasNivel(filtros);
    actualizarGraficoSubsector(filtros);
    actualizarGraficoComparativa(filtros);
}

// --- FUNCIONES DE ACTUALIZACIÓN DE GRÁFICOS INDIVIDUALES ---

function actualizarGraficoDistritos(filtros) {
    $.ajax({
        url: window.dashboardConfig.apiUrls.graficoDistritos,
        data: filtros,
        dataType: 'json',
        success: response => {
            // ✅ CAMBIO: Lee la configuración del gráfico desde el objeto global
            const settings = window.dashboardConfig.chartSettings.distritos;
            const option = {
                // ✅ CAMBIO: Usa el título desde la configuración
                title: { text: settings.title, left: 'center' },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                xAxis: { type: 'category', data: response.labels, axisLabel: { rotate: 45, interval: 0 } },
                yAxis: { type: 'value' },
                series: [{
                    name: 'Nº de Centros',
                    data: response.data,
                    type: 'bar',
                    itemStyle: { color: '#87CEEB' },
                    label: { show: true, position: 'top', color: '#464646', fontWeight: 'bold', fontSize: 12 }
                }],
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true }
            };
            chartDistritos.setOption(option);
        }
    });
}

function actualizarGraficoBurbujasNivel(filtros) {
    $.ajax({
        url: window.dashboardConfig.apiUrls.graficoNivel,
        data: filtros,
        dataType: 'json',
        success: response => {
            if (response.length === 0) {
                chartBurbujasNivel.clear();
                crearLeyendaNivel([]);
                return;
            }

            const packedData = prepararDatosBurbujas(response);
            crearLeyendaNivel(response);

            // ✅ CAMBIO: Lee la configuración del gráfico desde el objeto global
            const settings = window.dashboardConfig.chartSettings.nivel;
            const option = {
                // ✅ CAMBIO: Usa el título desde la configuración
                title: { text: settings.title, left: 'center' },
                tooltip: { formatter: p => `${p.data[3]}<br><b>Total: ${p.data[5]}</b>` },
                xAxis: { show: false, type: 'value', min: 0, max: 400 },
                yAxis: { show: false, type: 'value', min: 0, max: 400 },
                series: [{
                    type: 'scatter',
                    symbol: 'circle',
                    symbolSize: val => val[2] * 2,
                    data: packedData.map(d => [d.x, d.y, d.r, d.id, d.categoria, d.value]),
                    label: {
                        show: true,
                        formatter: p => {
                            const value = p.data[5];
                            const radius = p.data[2];
                            return radius > 25 ? `${p.data[3]}\n${value}` : `${value}`;
                        },
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: p => Math.max(Math.min(p.data[2] / 2.5, 16), 10),
                        textShadowColor: 'rgba(0, 0, 0, 0.6)',
                        textShadowBlur: 3
                    },
                    // ✅ CAMBIO: Usa la nueva función genérica para obtener el color
                    itemStyle: { color: p => getColor(p.data[4], 'nivel') }
                }],
                animationDuration: 1000,
                animationEasing: 'elasticOut'
            };
            chartBurbujasNivel.setOption(option, true);
        }
    });
}

function actualizarGraficoSubsector(filtros) {
    $.ajax({
        url: window.dashboardConfig.apiUrls.graficoSubsector,
        data: filtros,
        dataType: 'json',
        success: response => {
            const coloresPieMixtos = [
                { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#83bff6' }, { offset: 1, color: '#188df0' }] },
                { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#48D1CC' }, { offset: 1, color: '#008B8B' }] },
                { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#F87272' }, { offset: 1, color: '#D62929' }] },
                { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#A9CCE3' }, { offset: 1, color: '#5D8AA8' }] }
            ];
            // ✅ CAMBIO: Lee la configuración del gráfico desde el objeto global
            const settings = window.dashboardConfig.chartSettings.subsector;
            const option = {
                color: coloresPieMixtos,
                // ✅ CAMBIO: Usa el título desde la configuración
                title: { text: settings.title, left: 'center' },
                tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
                legend: { orient: 'vertical', left: 'left', top: 'bottom' },
                series: [{
                    name: 'Subsector',
                    type: 'pie',
                    radius: '60%',
                    center: ['50%', '50%'],
                    data: response,
                    emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
                    label: { show: true, formatter: '{b}\n{c} ({d}%)' },
                    labelLine: { show: true }
                }]
            };
            chartSubsector.setOption(option);
        }
    });
}

function actualizarGraficoComparativa(filtros) {
    $.ajax({
        url: window.dashboardConfig.apiUrls.graficoComparativa,
        data: filtros,
        dataType: 'json',
        success: response => {
            const colores = ['#5B9BD5', '#5DADE2', '#48C9B0', '#4682B4'];
            response.series.forEach((serie, index) => {
                serie.itemStyle = { color: colores[index % colores.length] };
                serie.label = { show: true, position: 'top', fontWeight: 'bold', color: '#464646', fontSize: 11 };
            });

            // ✅ CAMBIO: Lee la configuración del gráfico desde el objeto global
            const settings = window.dashboardConfig.chartSettings.comparativa;
            const option = {
                // ✅ CAMBIO: Usa el título desde la configuración
                title: { text: settings.title, left: 'center' },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: { top: 'bottom' },
                grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
                xAxis: [{ type: 'category', data: response.categories }],
                yAxis: [{ type: 'value' }],
                series: response.series
            };
            chartComparativa.setOption(option);
        }
    });
}

// --- FUNCIONES AUXILIARES ---

/**
 * ✅ NUEVA FUNCIÓN GENÉRICA: Obtiene un color desde la configuración.
 * Busca el color para un valor específico dentro de un mapeo de colores de un gráfico.
 * @param {string} valor - El valor a buscar (ej. '1ER NIVEL').
 * @param {string} chartName - El nombre de la configuración del gráfico (ej. 'nivel').
 * @returns {string} El código de color correspondiente o un color por defecto.
 */
function getColor(valor, chartName) {
    const mappings = window.dashboardConfig.chartSettings[chartName].colorMappings;
    return mappings[valor] || mappings['default'];
}

function crearLeyendaNivel(datos) {
    const legendContainer = document.getElementById('leyenda-burbujas-nivel');
    legendContainer.innerHTML = '';
    const categoriasUnicas = [...new Set(datos.map(d => d.categoria))];

    categoriasUnicas.forEach(categoria => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        // ✅ CAMBIO: Usa la nueva función genérica para obtener el color
        colorBox.style.backgroundColor = getColor(categoria, 'nivel');
        const label = document.createElement('span');
        label.textContent = categoria;
        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legendContainer.appendChild(legendItem);
    });
}

function prepararDatosBurbujas(datos) {
    const BUBBLE_CHART_SIZE = 400;
    const pack = d3.pack().size([BUBBLE_CHART_SIZE, BUBBLE_CHART_SIZE]).padding(15);
    const root = { name: "root", children: datos };
    const hierarchy = d3.hierarchy(root).sum(d => d.value);
    const packedRoot = pack(hierarchy);
    return packedRoot.leaves().map(node => ({
        id: node.data.id, value: node.data.value, categoria: node.data.categoria,
        x: node.x, y: node.y, r: node.r
    }));
}

// --- FUNCIONES PARA GRÁFICOS DE MODALES (HEATMAP) ---
// (Esta sección no requiere cambios para este paso, se mantiene igual)

export function renderHeatmap(chartType, chartDomId, statPrefix, filtros) {
    const chartDom = document.getElementById(chartDomId);
    let currentInstance = (chartType === 'dist_vs_nivel') ? heatmapNivel : heatmapSubsector;

    if (!currentInstance) {
        currentInstance = echarts.init(chartDom);
    }
    currentInstance.showLoading();

    const requestData = { ...filtros, type: chartType };

    $.ajax({
        url: window.dashboardConfig.apiUrls.analisisCruzado,
        data: requestData,
        dataType: 'json',
        success: response => {
            currentInstance.hideLoading();
            
            const kpi = response.kpiData;
            $(`#${statPrefix}-total`).text(kpi.totalEstablecimientos || 0);
            $(`#${statPrefix}-distritos`).text(kpi.totalDistritos || 0);
            $(`#${statPrefix}-distrito-max`).text(kpi.distritoConMasCentros || 'N/A');
            $(`#${statPrefix}-tipo-comun`).text(kpi.tipoMasComun || 'N/A');

            const option = {
                tooltip: {
                    position: 'top',
                    formatter: p => `<b>${p.value[2]}</b> establecimientos<br/>de tipo <b>${response.xAxisLabels[p.value[0]]}</b><br/>en <b>${response.yAxisLabels[p.value[1]]}</b>`
                },
                grid: { top: '5%', right: '2%', bottom: '15%', left: '3%', containLabel: true },
                xAxis: { type: 'category', data: response.xAxisLabels, splitArea: { show: true } },
                yAxis: { type: 'category', data: response.yAxisLabels, splitArea: { show: true } },
                visualMap: {
                    min: 1, max: Math.max(1, ...response.heatmapData.map(item => item[2])),
                    calculable: true, orient: 'horizontal', left: 'center', bottom: '0%',
                    inRange: { color: ['#eaf2fa', '#5b9bd5', '#1e3a5c'] }
                },
                series: [{
                    name: 'Establecimientos', type: 'heatmap', data: response.heatmapData,
                    label: { show: true, color: '#333', fontWeight: 'bold' },
                    emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
                }]
            };
            currentInstance.setOption(option);

            if (chartType === 'dist_vs_nivel') heatmapNivel = currentInstance;
            else heatmapSubsector = currentInstance;
        },
        error: () => {
            currentInstance.hideLoading();
        }
    });
}
