// static/js/common_modules/ui.js
// Módulo REUTILIZABLE para elementos de UI: filtros, modales, cards.

import { renderHeatmap } from './charts.js';

// --- LÓGICA DE INICIALIZACIÓN DE UI ---

/**
 * Inicializa los componentes principales de la UI y establece el callback para los filtros.
 * @param {function} onFilterChangeCallback - Función a llamar cuando un filtro cambia.
 */
export function initUI(onFilterChangeCallback) {
    $('.selectpicker').selectpicker({
        countSelectedText: numSelected => `${numSelected} seleccionados`
    });

    $('[data-toggle="popover"]').popover();

    $('.clear-selection-btn').on('click', function () {
        const target = $(this).data('target');
        $(target).val([]).selectpicker('refresh').trigger('change');
        $(this).blur();
    });

    const filterSelectors = window.dashboardConfig.elementSelectors.filters.join(', ');
    $(filterSelectors).on('change', onFilterChangeCallback);

    initInfoModal();
    initAnalysisModals(); // Esta función causaba el error
}

// --- LÓGICA DE TARJETAS (CARDS) ---

function animateCounter(element, duration = 900) {
    const target = +element.getAttribute('data-target');
    if (isNaN(target)) return;
    let startTimestamp = null;
    const step = timestamp => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.innerText = Math.floor(progress * target).toLocaleString('es');
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.innerText = target.toLocaleString('es');
        }
    };
    window.requestAnimationFrame(step);
}

export function actualizarCards(filtros) {
    $.ajax({
        url: window.dashboardConfig.apiUrls.generarDatosCards,
        data: filtros,
        dataType: 'json',
        success: response => {
            const cardSelectors = window.dashboardConfig.elementSelectors.cards;
            
            const totalElement = document.querySelector(cardSelectors.total);
            if (totalElement) {
                totalElement.setAttribute('data-target', response.total_establecimientos);
                animateCounter(totalElement, 500);
            }
            
            const maxElement = document.querySelector(cardSelectors.max);
            if (maxElement) {
                maxElement.innerText = response.distrito_max;
            }
        }
    });
}

// --- LÓGICA DE MODALES ---

function initInfoModal() {
    $(document).on('click', '.ver-mas-btn', function () {
        const institucionId = $(this).data('id');
        const institucionData = window.dashboardConfig.data.instituciones.find(inst => inst.id_unidad == institucionId || inst.id == institucionId);
        if (institucionData) {
            poblarYMostrarModalInfo(institucionData);
        }
    });
}

function poblarYMostrarModalInfo(data) {
    const mappings = window.dashboardConfig.fieldMappings;

    for (const elementId in mappings) {
        if (elementId === 'iconField') continue;

        const mappingValue = mappings[elementId];
        let textContent;

        if (typeof mappingValue === 'function') {
            textContent = mappingValue(data);
        } else {
            textContent = data[mappingValue] || 'No disponible';
        }
        
        const elemento = $(`#${elementId}`);
        elemento.text(textContent);

        if (elementId.startsWith('modal-') && ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].includes(elementId.split('-')[1])) {
            elemento.removeClass('closed open-24h');
            if (textContent.toLowerCase() === 'cerrado') {
                elemento.addClass('closed');
            } else if (textContent.toLowerCase() === '24 hrs') {
                elemento.addClass('open-24h');
            }
        }
    }

    $('#infoModal [data-toggle="tooltip"]').tooltip();
    $(window.dashboardConfig.elementSelectors.infoModal).modal('show');
}

/**
 * Inicializa los listeners para los modales de análisis cruzado.
 */
function initAnalysisModals() {
    // ✅ CORRECCIÓN: Comprobamos si la configuración para los modales de análisis existe.
    // Si no existe (como en el dashboard de educación), esta función no hará nada y no causará un error.
    if (!window.dashboardConfig.elementSelectors.analysisModals) {
        return;
    }

    const modalSelectors = window.dashboardConfig.elementSelectors.analysisModals;
    const statPrefixes = window.dashboardConfig.elementSelectors.analysisStatPrefixes;

    $(modalSelectors.nivel).on('shown.bs.modal', () => {
        const filtros = {
            'distritos[]': $('#dropdown1').val(),
            'niveles[]': $('#dropdown2').val(),
            'subsectores[]': $('#dropdown3').val()
        };
        renderHeatmap('dist_vs_nivel', 'grafico-analisis-nivel', statPrefixes.nivel, filtros);
    });

    $(modalSelectors.subsector).on('shown.bs.modal', () => {
        const filtros = {
            'distritos[]': $('#dropdown1').val(),
            'niveles[]': $('#dropdown2').val(),
            'subsectores[]': $('#dropdown3').val()
        };
        renderHeatmap('dist_vs_subsector', 'grafico-analisis-subsector', statPrefixes.subsector, filtros);
    });
}
