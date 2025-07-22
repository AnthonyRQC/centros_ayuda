from django.urls import path
# from . import views

app_name = 'iglesias'

urlpatterns = [
    path('dashboard/', lambda request: None, name='dashboard'), # Vista vacía temporal
]