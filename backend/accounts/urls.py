from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    AdminBasculerActivationCompteView,
    AdminPrestatairesEnAttenteView,
    AdminValiderKYCView,
    BasculerModeView,
    ClientDetailView,
    DevenirPrestataireView,
    InscriptionView,
    PrestataireDetailView,
    PrestataireKYCUploadView,
    PrestataireKYCVerifierView,
    PrestataireListView,
    ProfilView,
)

urlpatterns = [
    path('inscription/', InscriptionView.as_view(), name='inscription'),
    path('connexion/', TokenObtainPairView.as_view(), name='connexion'),
    path('connexion/rafraichir/', TokenRefreshView.as_view(), name='connexion-rafraichir'),

    path('moi/', ProfilView.as_view(), name='profil'),
    path('clients/<int:pk>/', ClientDetailView.as_view(), name='client-detail'),
    path('prestataires/', PrestataireListView.as_view(), name='prestataire-list'),
    path('prestataires/<int:pk>/', PrestataireDetailView.as_view(), name='prestataire-detail'),
    path('moi/kyc/', PrestataireKYCUploadView.as_view(), name='prestataire-kyc-upload'),
    path('moi/kyc/verifier/', PrestataireKYCVerifierView.as_view(), name='prestataire-kyc-verifier'),
    path('moi/devenir-prestataire/', DevenirPrestataireView.as_view(), name='devenir-prestataire'),
    path('moi/basculer-mode/', BasculerModeView.as_view(), name='basculer-mode'),
    path('admin/prestataires-en-attente/', AdminPrestatairesEnAttenteView.as_view(), name='admin-prestataires-en-attente'),
    path('admin/prestataires/<int:pk>/valider-kyc/', AdminValiderKYCView.as_view(), name='admin-valider-kyc'),
    path('admin/utilisateurs/<int:pk>/basculer-activation/', AdminBasculerActivationCompteView.as_view(), name='admin-basculer-activation'),
]