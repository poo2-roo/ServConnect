from django.urls import path

from .views import ChatbotVocalView, MesInteractionsVocalesView

urlpatterns = [
    path('chatbot-vocal/', ChatbotVocalView.as_view(), name='chatbot-vocal'),
    path('chatbot-vocal/historique/', MesInteractionsVocalesView.as_view(), name='chatbot-vocal-historique'),
]