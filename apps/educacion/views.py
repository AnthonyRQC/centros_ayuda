# educacion/views.py
import pandas as pd
import json
import os
import numpy as np
from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings

# --- FUNCIÓN CENTRAL DE DATOS ---
def get_educacion_dataframe(filtros):
    """
    Carga, une y filtra todos los datos relacionados con las unidades educativas.
    Ahora es robusto y funciona tanto con QueryDicts de API como con dicts de carga inicial.
    """
    base_path = os.path.join(settings.BASE_DIR, 'static_global', 'educacion')

    try:
        df_unidades = pd.read_csv(os.path.join(base_path, 'unidades_educativas.csv'))
        df_niveles = pd.read_csv(os.path.join(base_path, 'relacion_unidades_niveles.csv'))
        df_subsistemas = pd.read_csv(os.path.join(base_path, 'relacion_unidades_subsistemas.csv'))
        df_turnos = pd.read_csv(os.path.join(base_path, 'relacion_unidades_turnos.csv'))
    except FileNotFoundError as e:
        print(f"Error: No se encontró el archivo {e.filename}")
        return pd.DataFrame()

    niveles_agg = df_niveles.groupby('id_unidad')['nivel'].apply(list).reset_index()
    subsistemas_agg = df_subsistemas.groupby('id_unidad')['subsistema'].apply(list).reset_index()
    turnos_agg = df_turnos.groupby('id_unidad')['turno'].apply(list).reset_index()

    df = pd.merge(df_unidades, niveles_agg, on='id_unidad', how='left')
    df = pd.merge(df, subsistemas_agg, on='id_unidad', how='left')
    df = pd.merge(df, turnos_agg, on='id_unidad', how='left')

    # --- APLICAR FILTROS ---
    if 'distritos[]' in filtros and filtros.getlist('distritos[]'):
        distritos_seleccionados = filtros.getlist('distritos[]')
        df['distrito'] = pd.to_numeric(df['distrito'], errors='coerce')
        distritos_int = [int(d) for d in distritos_seleccionados]
        df = df[df['distrito'].isin(distritos_int)]

    if 'dependencias[]' in filtros and filtros.getlist('dependencias[]'):
        dependencias_seleccionadas = filtros.getlist('dependencias[]')
        df = df[df['dependencia'].isin(dependencias_seleccionadas)]

    if 'subsistemas[]' in filtros and filtros.getlist('subsistemas[]'):
        subsistemas_seleccionados = filtros.getlist('subsistemas[]')
        df = df[df['subsistema'].apply(lambda x: isinstance(x, list) and any(s in subsistemas_seleccionados for s in x))]

    return df

# --- VISTA PRINCIPAL DEL DASHBOARD ---
def educacion_dashboard(request):
    geojson_path = os.path.join(settings.BASE_DIR, 'static_global/geojson/geo_distritos.geojson')
    with open(geojson_path, 'r') as file:
        distritos_geojson = json.load(file)

    df_inicial = get_educacion_dataframe({})
    df_limpio = df_inicial.replace({np.nan: None})
    unidades_educativas_json = df_limpio.to_dict('records')

    base_path = os.path.join(settings.BASE_DIR, 'static_global', 'educacion')
    dependencias = ['FISCAL', 'PRIVADA', 'CONVENIO']
    subsistemas = pd.read_csv(os.path.join(base_path, 'catalogo_subsistemas.csv'))['nombre_subsistema'].tolist()

    context = {
        'distritos_geojson': json.dumps(distritos_geojson),
        'unidades_educativas_json': json.dumps(unidades_educativas_json),
        'lista_distritos_completa': json.dumps(sorted([f['properties']['distrito'] for f in distritos_geojson['features']])),
        'lista_dependencias': dependencias,
        'lista_subsistemas': subsistemas,
    }
    return render(request, 'educacion/dashboard_educacion.html', context)

# --- VISTAS DE API ---
def filtrar_unidades_api(request):
    df_filtrado = get_educacion_dataframe(request.GET)
    df_limpio = df_filtrado.replace({np.nan: None})
    data = df_limpio.to_dict('records')
    return JsonResponse(data, safe=False)

def generar_grafico_dependencia_api(request):
    df = get_educacion_dataframe(request.GET)
    if df.empty:
        return JsonResponse([], safe=False)
    conteo = df.groupby('dependencia').size()
    data = [{'name': k, 'value': int(v)} for k, v in conteo.items()]
    return JsonResponse(data, safe=False)

def generar_datos_cards_educacion_api(request):
    df = get_educacion_dataframe(request.GET)
    total_unidades = len(df)
    distrito_max = "N/A"

    # ✅ CORRECCIÓN: Hacemos el cálculo a prueba de valores nulos (NaN).
    if not df.empty and 'distrito' in df.columns:
        # 1. Creamos una Serie solo con los distritos que NO son nulos.
        distritos_validos = df['distrito'].dropna()
        
        # 2. Solo si quedan distritos válidos, procedemos a calcular.
        if not distritos_validos.empty:
            # 3. Ahora es seguro convertir a entero, porque ya no hay NaN.
            conteo = distritos_validos.astype(int).value_counts()
            if not conteo.empty:
                distrito_max = f"Distrito {conteo.idxmax()}"
    
    data = {
        'total_establecimientos': total_unidades,
        'distrito_max': distrito_max
    }
    return JsonResponse(data)
