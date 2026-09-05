from django.urls import path

from .views import AmeliorerImageBrouillonView, ChatbotVocalView, GenererLegendeView, MesInteractionsVocalesView

urlpatterns = [
    path('chatbot-vocal/', ChatbotVocalView.as_view(), name='chatbot-vocal'),
    path('chatbot-vocal/historique/', MesInteractionsVocalesView.as_view(), name='chatbot-vocal-historique'),
    path('ameliorer-image/', AmeliorerImageBrouillonView.as_view(), name='ameliorer-image-brouillon'),
    path('generer-legende/', GenererLegendeView.as_view(), name='generer-legende'),
]