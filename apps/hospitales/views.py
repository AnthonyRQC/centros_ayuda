# apps/hospitales/views.py
from django.http import JsonResponse
import json
import pandas as pd
from django.shortcuts import render
from django.conf import settings
import os
import numpy as np


#  Esta función centraliza la lectura del CSV y la aplicación de filtros.
def get_filtered_dataframe(request):
    """
    Lee el archivo CSV y aplica los filtros de la petición GET.
    Devuelve un tuple: (DataFrame, error_response).
    Si hay un error, el DataFrame es None y error_response contiene el JsonResponse.
    Si todo va bien, error_response es None.
    """
    csv_path = os.path.join(settings.BASE_DIR, 'static_global/geojson/salud_distritos.csv')
    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        error_response = JsonResponse({"error": "CSV file not found"}, status=404)
        return None, error_response

    # Obtener filtros de la petición
    niveles_seleccionados = request.GET.getlist('niveles[]')
    subsectores_seleccionados = request.GET.getlist('subsectores[]')
    distritos_seleccionados = request.GET.getlist('distritos[]')

    # Aplicar filtros si existen
    if niveles_seleccionados:
        df = df[df['nivel'].isin(niveles_seleccionados)]
    if subsectores_seleccionados:
        df = df[df['subsector'].isin(subsectores_seleccionados)]
    if distritos_seleccionados:
        # Aseguramos que la columna 'distritos' sea numérica para la comparación
        df['distritos'] = pd.to_numeric(df['distritos'], errors='coerce')
        distritos_seleccionados_int = [int(d) for d in distritos_seleccionados]
        df = df[df['distritos'].isin(distritos_seleccionados_int)]

    return df, None


# Aquí cargamos el geojson y el csv, y los pasamos al template
def hospitales_dashboard(request):
    # 1. Cargar el GeoJSON
    geojson_path = os.path.join(settings.BASE_DIR, 'static_global/geojson/geo_distritos.geojson')
    try:
        with open(geojson_path, 'r') as file:
            distritos_geojson = json.load(file)
    except FileNotFoundError:
        return JsonResponse({"error": "GeoJSON file not found"}, status=404)
    
    # 2. Cargar el CSV de instituciones
    csv_path = os.path.join(settings.BASE_DIR, 'static_global/geojson/salud_distritos.csv')
    try:
        df = pd.read_csv(csv_path)
        df_limpio = df.replace({np.nan: None})
        instituciones = df_limpio.to_dict('records')
    except FileNotFoundError:
        df = pd.DataFrame() # Crear un DataFrame vacío si no se encuentra el archivo
        instituciones = []

    # 3. LISTA #1: Generar la lista de distritos que SÍ TIENEN centros de salud (para el filtro)
    if not df.empty:
        distritos_con_centros_numericos = pd.to_numeric(df['distritos'], errors='coerce')
        lista_distritos_con_centros_numpy = sorted(distritos_con_centros_numericos.dropna().unique().astype(int))
        lista_distritos_con_centros = [int(d) for d in lista_distritos_con_centros_numpy]
    else:
        lista_distritos_con_centros = []

    # 4. LISTA #2: Generar la lista COMPLETA de distritos desde el GeoJSON (para el zoom)
    try:
        distritos_del_geojson = [
            feature['properties']['distrito'] 
            for feature in distritos_geojson['features'] 
            if 'properties' in feature and 'distrito' in feature['properties']
        ]
        lista_distritos_completa = sorted(list(set(distritos_del_geojson)))
    except (KeyError, TypeError):
        lista_distritos_completa = []
        
    total_establecimientos = len(df)
    distrito_max = "Sin datos"
    if not df.empty:
        df_temp = df.copy()
        df_temp['distritos'] = pd.to_numeric(df_temp['distritos'], errors='coerce')
        df_temp.dropna(subset=['distritos'], inplace=True)
        if not df_temp.empty:
            df_temp['distritos'] = df_temp['distritos'].astype(int)
            conteo_por_distrito = df_temp.groupby('distritos').size()
            if not conteo_por_distrito.empty:
                distrito_id_max = conteo_por_distrito.idxmax()
                distrito_max = f"Distrito {distrito_id_max}"

    # 5. Enviar AMBAS listas al template con nombres diferentes
    return render(request, 'hospitales/dashboard.html', {
        'distritos_geojson': json.dumps(distritos_geojson),
        'instituciones': json.dumps(instituciones),
        'lista_distritos_con_centros': lista_distritos_con_centros, # Para el dropdown de filtro
        'lista_distritos_completa': json.dumps(lista_distritos_completa), # Para el dropdown de zoom
        'total_establecimientos_inicial': total_establecimientos,
        'distrito_max_inicial': distrito_max
    })


# Aquí cargamos el geojson y el csv, y los pasamos al template
def mapa(request):
    return None


def filtrar_instituciones_api(request):
    df, error = get_filtered_dataframe(request)
    if error:
        return error

    # El resto de la lógica específica de esta función
    df_limpio = df.replace({np.nan: None})
    instituciones_filtradas = df_limpio.to_dict('records')
    
    return JsonResponse(instituciones_filtradas, safe=False)


def generar_grafico_distritos_api(request):
    df, error = get_filtered_dataframe(request)
    if error:
        return error

    # Lógica específica del gráfico
    df['distritos'] = pd.to_numeric(df['distritos'], errors='coerce')
    df.dropna(subset=['distritos'], inplace=True)
    df['distritos'] = df['distritos'].astype(int)
    conteo_por_distrito = df.groupby('distritos')['nombre_establecimiento'].count().sort_index()
    data_para_grafico = {
        'labels': [f"Distrito {d}" for d in conteo_por_distrito.index],
        'data': conteo_por_distrito.values.tolist()
    }
    return JsonResponse(data_para_grafico)


# Generar gráfico por nivel de atención (burbuja)
def generar_grafico_nivel_api(request):
    df, error = get_filtered_dataframe(request)
    if error:
        return error

    # Lógica específica del gráfico
    df.dropna(subset=['nivel'], inplace=True)
    conteo = df.groupby('nivel')['nombre_establecimiento'].count()
    data_para_grafico = [
        {'id': nivel, 'value': count, 'categoria': nivel} 
        for nivel, count in conteo.items()
    ]
    return JsonResponse(data_para_grafico, safe=False)

# Generar gráfico por subsector
def generar_grafico_subsector_api(request):
    df, error = get_filtered_dataframe(request)
    if error:
        return error

    # Lógica específica del gráfico
    df.dropna(subset=['subsector'], inplace=True)
    conteo = df.groupby('subsector')['nombre_establecimiento'].count()
    data_para_grafico = [{'value': v, 'name': k} for k, v in conteo.items()]
    return JsonResponse(data_para_grafico, safe=False)


# Generar gráfico por niveles y subsectores (agrupado)
def generar_grafico_niveles_subsectores_api(request):
    df, error = get_filtered_dataframe(request)
    if error:
        return error

    # Lógica específica del gráfico
    orden_niveles = ['1ER NIVEL', '2DO NIVEL', '3ER NIVEL']
    orden_subsectores = ['PÚBLICO', 'SEGURIDAD SOCIAL (CAJAS)', 'ORGANISMOS PRIVADOS', 'IGLESIA']
    
    # Aquí usamos el DataFrame ya filtrado (df) en lugar de volver a filtrar
    df_filtrado = df[df['nivel'].isin(orden_niveles) & df['subsector'].isin(orden_subsectores)]
    
    # ... (el resto de la lógica de crosstab y reindex no cambia) ...
    if df_filtrado.empty:
        tabla_cruzada = pd.DataFrame(0, index=orden_niveles, columns=orden_subsectores)
    else:
        tabla_cruzada = pd.crosstab(df_filtrado['nivel'], df_filtrado['subsector'])

    tabla_cruzada = tabla_cruzada.reindex(index=orden_niveles, fill_value=0)
    tabla_cruzada = tabla_cruzada.reindex(columns=orden_subsectores, fill_value=0)

    data_para_grafico = {
        'categories': tabla_cruzada.index.tolist(),
        'series': [
            {'name': subsector, 'type': 'bar', 'data': tabla_cruzada[subsector].tolist()}
            for subsector in tabla_cruzada.columns
        ]
    }
    return JsonResponse(data_para_grafico)

def generar_datos_cards_api(request):
    df, error = get_filtered_dataframe(request)
    if error:
        return error

    # Lógica específica de las tarjetas
    total_establecimientos = len(df)
    distrito_max = "Sin datos"
    if not df.empty:
        df_temp = df.copy()
        df_temp['distritos'] = pd.to_numeric(df_temp['distritos'], errors='coerce')
        df_temp.dropna(subset=['distritos'], inplace=True)
        if not df_temp.empty:
            df_temp['distritos'] = df_temp['distritos'].astype(int)
            conteo_por_distrito = df_temp.groupby('distritos').size()
            if not conteo_por_distrito.empty:
                distrito_id_max = conteo_por_distrito.idxmax()
                distrito_max = f"Distrito {distrito_id_max}"
    data = {
        'total_establecimientos': total_establecimientos,
        'distrito_max': distrito_max
    }
    return JsonResponse(data)

# apps/hospitales/views.py

def generar_analisis_cruzado_api(request):
    # Usamos la función refactorizada para obtener el DataFrame filtrado
    df, error = get_filtered_dataframe(request)
    if error:
        return error

    chart_type = request.GET.get('type', 'dist_vs_nivel')

    # --- INICIO DE LA CORRECCIÓN ---

    # 1. OBTENER LA LISTA COMPLETA DE DISTRITOS
    # Para asegurar que el heatmap muestre todos los distritos, incluso los que no tienen centros.
    geojson_path = os.path.join(settings.BASE_DIR, 'static_global/geojson/geo_distritos.geojson')
    try:
        with open(geojson_path, 'r') as file:
            distritos_geojson = json.load(file)
        todos_los_distritos = sorted([
            feature['properties']['distrito'] 
            for feature in distritos_geojson['features'] 
            if 'properties' in feature and 'distrito' in feature['properties']
        ])
    except (FileNotFoundError, KeyError, TypeError):
        todos_los_distritos = list(range(1, 15)) # Un fallback por si falla la lectura

    # 2. DEFINIR EJES Y ORDEN
    if chart_type == 'dist_vs_subsector':
        eje_x_col = 'subsector'
        eje_y_col = 'distritos'
        eje_x_orden = ['PÚBLICO', 'SEGURIDAD SOCIAL (CAJAS)', 'ORGANISMOS PRIVADOS', 'IGLESIA']
    else: # dist_vs_nivel por defecto
        eje_x_col = 'nivel'
        eje_y_col = 'distritos'
        eje_x_orden = ['1ER NIVEL', '2DO NIVEL', '3ER NIVEL']

    # 3. LIMPIAR DATOS
    # Convertir distritos a número y eliminar filas donde falten datos cruciales
    df[eje_y_col] = pd.to_numeric(df[eje_y_col], errors='coerce')
    df.dropna(subset=[eje_x_col, eje_y_col], inplace=True)
    df[eje_y_col] = df[eje_y_col].astype(int)

    if df.empty:
        # Si no hay datos tras filtrar, devolver una estructura vacía pero válida
        return JsonResponse({
            'heatmapData': [], 
            'xAxisLabels': eje_x_orden, 
            'yAxisLabels': [f"Distrito {d}" for d in todos_los_distritos], 
            'kpiData': {
                'totalEstablecimientos': 0, 'totalDistritos': 0,
                'distritoConMasCentros': 'N/A', 'tipoMasComun': 'N/A'
            }
        })

    # 4. PROCESAR DATOS PARA EL HEATMAP
    tabla_cruzada = pd.crosstab(df[eje_y_col], df[eje_x_col])
    
    # Reindexar para asegurar que todas las columnas y TODOS los distritos estén presentes
    tabla_cruzada = tabla_cruzada.reindex(columns=eje_x_orden, fill_value=0)
    tabla_cruzada = tabla_cruzada.reindex(index=todos_los_distritos, fill_value=0)
    
    heatmap_data = []
    y_axis_labels = [f"Distrito {i}" for i in tabla_cruzada.index]
    x_axis_labels = tabla_cruzada.columns.tolist()

    for y_idx, distrito in enumerate(tabla_cruzada.index):
        for x_idx, tipo in enumerate(x_axis_labels):
            # SOLUCIÓN AL TypeError: Convertir el valor a int() de Python
            value = int(tabla_cruzada.loc[distrito, tipo])
            if value > 0:
                heatmap_data.append([x_idx, y_idx, value])

    # 5. PROCESAR DATOS PARA LAS TARJETAS (KPIs)
    conteo_por_distrito = df.groupby(eje_y_col).size()
    distrito_con_mas_centros = f"Distrito {conteo_por_distrito.idxmax()}" if not conteo_por_distrito.empty else "N/A"
    
    conteo_por_tipo = df.groupby(eje_x_col).size()
    tipo_mas_comun = conteo_por_tipo.idxmax() if not conteo_por_tipo.empty else "N/A"

    kpi_data = {
        # SOLUCIÓN AL TypeError: Convertir a int() para estar seguros
        'totalEstablecimientos': int(len(df)),
        'totalDistritos': int(len(conteo_por_distrito)),
        'distritoConMasCentros': distrito_con_mas_centros,
        'tipoMasComun': tipo_mas_comun
    }

    # 6. RESPUESTA FINAL
    response_data = {
        'heatmapData': heatmap_data,
        'xAxisLabels': x_axis_labels,
        'yAxisLabels': y_axis_labels,
        'kpiData': kpi_data
    }
    
    return JsonResponse(response_data)

    # --- FIN DE LA CORRECCIÓN ---
