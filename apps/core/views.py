# apps/core/views.py

from django.shortcuts import render

def home_view(request):
    """
    Vista para la página de inicio del proyecto.
    Renderiza la plantilla base de AdminLTE con contenido de bienvenida.
    """
    context = {
        'dashboard_title': 'Panel Principal',
        'active_menu': 'home' # Para resaltar el enlace "Inicio" en el sidebar
    }
    return render(request, 'core/home.html', context)