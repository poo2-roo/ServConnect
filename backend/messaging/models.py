from django.conf import settings
from django.db import models


class Conversation(models.Model):
    """Fil de discussion entre un client et un prestataire, autour d'un service."""

    client = models.ForeignKey(
        'accounts.Client', on_delete=models.CASCADE, related_name='conversations'
    )
    prestataire = models.ForeignKey(
        'accounts.Prestataire', on_delete=models.CASCADE, related_name='conversations'
    )
    service = models.ForeignKey(
        'services.Service', on_delete=models.SET_NULL,
        blank=True, null=True, related_name='conversations',
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    derniere_activite = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Conversation"
        verbose_name_plural = "Conversations"
        ordering = ['-derniere_activite']

    def __str__(self):
        return f"Conversation : {self.client} ↔ {self.prestataire}"


class Message(models.Model):
    """
    Message échangé dans une conversation. `est_suggestion_ia` marque les
    messages générés par le module IA n°9 (réponses automatisées suggérées
    au prestataire) une fois qu'il choisit de les envoyer.
    """

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='messages'
    )
    expediteur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='messages_envoyes'
    )
    contenu = models.TextField()
    est_suggestion_ia = models.BooleanField(default=False)
    est_lu = models.BooleanField(default=False)
    date_envoi = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        ordering = ['date_envoi']

    def __str__(self):
        return f"Message de {self.expediteur} — {self.date_envoi:%d/%m/%Y %H:%M}"