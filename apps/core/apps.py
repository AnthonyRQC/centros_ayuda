# apps/core/apps.py
from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core' # ¡Este es el nombre del módulo!
                       # Si tu AppConfig.name fuera solo 'core', también tendrías que ponerlo así.
                       # Pero la ruta completa con 'apps.' es la más segura aquí.