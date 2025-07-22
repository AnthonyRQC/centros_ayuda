from django.apps import AppConfig

class HospitalesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hospitales' # ¡Este es el nombre del módulo!
                              # Si tu AppConfig.name fuera solo 'hospitales', también tendrías que ponerlo así.
                              # Pero la ruta completa con 'apps.' es la más segura aquí.