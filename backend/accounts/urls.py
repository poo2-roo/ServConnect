from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminBasculerActivationCompteView,
    AdminLeverSanctionView,
    AdminPrestatairesEnAttenteView,
    AdminResoudreLitigeView,
    AdminSanctionnerUtilisateurView,
    AdminUtilisateurDetailView,
    AdminUtilisateursListView,
    AdminValiderKYCView,
    BasculerModeView,
    ClientDetailView,
    ClientLocalisationUpdateView,
    ConnexionView,
    DevenirPrestataireView,
    InscriptionView,
    LitigeListCreateView,
    MonProfilPrestataireUpdateView,
    MonProfilPrestataireView,
    PrestataireCategoriesUpdateView,
    PrestataireDetailView,
    PrestataireKYCUploadView,
    PrestataireKYCVerifierView,
    PrestataireListView,
    ProfilView,
)

urlpatterns = [
    path('inscription/', InscriptionView.as_view(), name='inscription'),
    path('connexion/', ConnexionView.as_view(), name='connexion'),
    path('connexion/rafraichir/', TokenRefreshView.as_view(), name='connexion-rafraichir'),

    path('moi/', ProfilView.as_view(), name='profil'),
    path('moi/localisation/', ClientLocalisationUpdateView.as_view(), name='client-localisation-update'),
    path('moi/kyc/', PrestataireKYCUploadView.as_view(), name='prestataire-kyc-upload'),
    path('moi/kyc/verifier/', PrestataireKYCVerifierView.as_view(), name='prestataire-kyc-verifier'),
    path('moi/devenir-prestataire/', DevenirPrestataireView.as_view(), name='devenir-prestataire'),
    path('moi/basculer-mode/', BasculerModeView.as_view(), name='basculer-mode'),
    path('moi/categories/', PrestataireCategoriesUpdateView.as_view(), name='prestataire-categories'),
    path('moi/prestataire/', MonProfilPrestataireView.as_view(), name='mon-profil-prestataire'),
    path('moi/prestataire/modifier/', MonProfilPrestataireUpdateView.as_view(), name='mon-profil-prestataire-modifier'),

    path('clients/<int:pk>/', ClientDetailView.as_view(), name='client-detail'),
    path('prestataires/', PrestataireListView.as_view(), name='prestataire-list'),
    path('prestataires/<int:pk>/', PrestataireDetailView.as_view(), name='prestataire-detail'),

    path('litiges/', LitigeListCreateView.as_view(), name='litiges-list-create'),

    path('admin/prestataires-en-attente/', AdminPrestatairesEnAttenteView.as_view(), name='admin-prestataires-en-attente'),
    path('admin/prestataires/<int:pk>/valider-kyc/', AdminValiderKYCView.as_view(), name='admin-valider-kyc'),
    path('admin/utilisateurs/', AdminUtilisateursListView.as_view(), name='admin-utilisateurs-list'),
    path('admin/utilisateurs/<int:pk>/', AdminUtilisateurDetailView.as_view(), name='admin-utilisateur-detail'),
    path('admin/utilisateurs/<int:pk>/basculer-activation/', AdminBasculerActivationCompteView.as_view(), name='admin-basculer-activation'),
    path('admin/utilisateurs/<int:pk>/sanctionner/', AdminSanctionnerUtilisateurView.as_view(), name='admin-sanctionner-utilisateur'),
    path('admin/utilisateurs/<int:pk>/lever-sanction/', AdminLeverSanctionView.as_view(), name='admin-lever-sanction'),
    path('admin/litiges/<int:pk>/resoudre/', AdminResoudreLitigeView.as_view(), name='admin-resoudre-litige'),
]