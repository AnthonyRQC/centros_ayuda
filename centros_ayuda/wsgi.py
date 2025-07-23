import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'centros_ayuda.settings')

application = get_wsgi_application()
# Si habías añadido también la línea 'application = DjangoWhiteNoise(application)', asegúrate de que también esté eliminada o comentada.