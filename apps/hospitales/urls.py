from django.urls import path
from . import views # Importa la vista que acabas de crear

app_name = 'hospitales'

urlpatterns = [
     path('dashboard/', views.hospitales_dashboard, name='dashboard'),
     path('api/filtrar-instituciones/', views.filtrar_instituciones_api, name='filtrar_instituciones_api'),
     path('api/generar-grafico/', views.generar_grafico_distritos_api, name='generar_grafico_api'),
     path('api/generar-grafico-nivel/', views.generar_grafico_nivel_api, name='generar_grafico_nivel_api'),
     path('api/generar-grafico-subsector/', views.generar_grafico_subsector_api, name='generar_grafico_subsector_api'),
     path('api/grafico-niveles-subsectores/', views.generar_grafico_niveles_subsectores_api, name='generar_grafico_niveles_subsectores_api'),
     path('api/datos-cards/', views.generar_datos_cards_api, name='generar_datos_cards_api'),
     path('api/analisis-cruzado/', views.generar_analisis_cruzado_api, name='generar_analisis_cruzado_api'),

]