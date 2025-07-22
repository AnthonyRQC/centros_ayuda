# educacion/urls.py
from django.urls import path
from . import views

app_name = 'educacion'

urlpatterns = [
    # URL para la página principal del dashboard
    path('dashboard/', views.educacion_dashboard, name='educacion_dashboard'),

    # --- URLs de la API ---
    path('api/filtrar-unidades/', views.filtrar_unidades_api, name='filtrar_unidades_api'),
    path('api/cards/', views.generar_datos_cards_educacion_api, name='generar_datos_cards_api'),
    path('api/grafico-dependencia/', views.generar_grafico_dependencia_api, name='generar_grafico_dependencia_api'),
]
