from django.contrib import admin
from django.urls import path, include # Asegúrate de que 'include' esté importado
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('admin/', admin.site.urls),

    path('', include('apps.core.urls')),
    
    path('users/', include('apps.users.urls')), # URLs de la app de usuarios
    path('centros_salud/', include('apps.hospitales.urls')), # Para el dashboard/formularios de hospitales
    path('educacion/', include('apps.educacion.urls')), # Para el dashboard/formularios de unidades educativas
    path('iglesias/', include('apps.iglesias.urls')), # Para el dashboard/formularios de iglesias
    path('general/', include('apps.general.urls')), # Para el dashboard/formularios generales
]

# ESTO ES CRUCIAL PARA SERVIR ARCHIVOS ESTÁTICOS EN MODO DE DESARROLLO
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # Si planeas subir archivos de usuario (media), también necesitas esto:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)