from django.urls import path
from .views import (
    CategorieListView,
    RecommandationServicesView,
    RedigerDescriptionView,
    ServiceDetailView,
    ServiceGenererImageView,
    ServiceImageAmeliorerView,
    ServiceImageUploadView,
    ServiceListCreateView,
    ServiceOptimiserPrixView,
)

urlpatterns = [
    path('categories/', CategorieListView.as_view(), name='categorie-list'),
    path('services/', ServiceListCreateView.as_view(), name='service-list-create'),
    path('services/recommandations/', RecommandationServicesView.as_view(), name='service-recommandations'),
    path('rediger-description/', RedigerDescriptionView.as_view(), name='rediger-description'),
    path('services/<int:pk>/', ServiceDetailView.as_view(), name='service-detail'),
    path('services/<int:pk>/optimiser-prix/', ServiceOptimiserPrixView.as_view(), name='service-optimiser-prix'),
    path('services/<int:pk>/images/', ServiceImageUploadView.as_view(), name='service-image-upload'),
    path('services/<int:pk>/generer-image/', ServiceGenererImageView.as_view(), name='service-generer-image'),
    path('images/<int:pk>/ameliorer/', ServiceImageAmeliorerView.as_view(), name='service-image-ameliorer'),
]