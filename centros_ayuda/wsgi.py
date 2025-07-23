import os

from django.core.wsgi import get_wsgi_application
from whitenoise.django import DjangoWhiteNoise # Older versions, now integrated via middleware

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project_name.settings')

application = get_wsgi_application()
# application = DjangoWhiteNoise(application) # This line is often no longer needed with modern WhiteNoise via MIDDLEWARE
