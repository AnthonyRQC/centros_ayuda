from django.urls import path
from . import views # Importa la vista que acabas de crear

app_name = 'general'

urlpatterns = [
    path('dashboard/', views.dashboard, name='dashboard'),
]
