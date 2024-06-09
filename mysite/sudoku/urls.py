from django.urls import path

from . import views

from django.urls import path
from .views import load_pickle_data


urlpatterns = [
    # No difficulty parameter (default)
    path('<str:difficulty>', views.index,
         name='index'),  # With difficulty parameter
    path('', views.index, name='index'),
    path('api/load-data/', load_pickle_data, name='load_pickle_data'),

]
