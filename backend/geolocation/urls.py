from django.urls import path

from .views import (
    AnalyserAdresseView,
    LocalisationDetailView,
    LocalisationETAView,
    LocalisationListCreateView,
    LocalisationProximiteView,
)

urlpatterns = [
    path('localisations/', LocalisationListCreateView.as_view(), name='localisation-list-create'),
    path('localisations/proximite/', LocalisationProximiteView.as_view(), name='localisation-proximite'),
    path('localisations/<int:pk>/', LocalisationDetailView.as_view(), name='localisation-detail'),
    path('localisations/<int:pk>/analyser/', AnalyserAdresseView.as_view(), name='localisation-analyser'),
    path('localisations/<int:pk>/eta/', LocalisationETAView.as_view(), name='localisation-eta'),
]