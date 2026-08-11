from django.conf import settings
from django.db import models

class JournalAppelIA(models.Model):
    """
    Journal de chaque appel effectué à l'API Gemini, tous modules confondus.
    Sert à suivre l'usage (quota gratuit Gemini Flash), diagnostiquer les
    erreurs, et alimenter les statistiques du rapport de stage.
    """

    class Module(models.IntegerChoices):
        NLP_ADRESSES = 1, "NLP — Compréhension des adresses"
        KYC = 2, "KYC — Vérification d'identité"
        ROUTAGE_ETA = 3, "Routage géospatial / ETA"
        CHATBOT_VOCAL = 4, "Chatbot vocal"
        REDACTION_CONTENU = 5, "Rédaction assistée de contenu"
        RETOUCHE_IMAGE = 6, "Retouche / amélioration d'image"
        OPTIMISATION_PRIX = 7, "Optimisation des prix"
        RECOMMANDATION = 8, "Moteur de recommandation"
        REPONSES_AUTO = 9, "Suggestions de réponses automatiques"

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        blank=True, null=True, related_name='appels_ia',
    )
    module = models.PositiveSmallIntegerField(choices=Module.choices)
    modele_utilise = models.CharField(max_length=50, default='gemini-2.5-flash')

    tokens_entree = models.PositiveIntegerField(default=0)
    tokens_sortie = models.PositiveIntegerField(default=0)

    succes = models.BooleanField(default=True)
    message_erreur = models.TextField(blank=True)
    duree_ms = models.PositiveIntegerField(
        blank=True, null=True, help_text="Temps de réponse en millisecondes."
    )

    date_appel = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Journal d'appel IA"
        verbose_name_plural = "Journal des appels IA"
        ordering = ['-date_appel']
        indexes = [models.Index(fields=['module', 'date_appel'])]

    def __str__(self):
        statut = "✓" if self.succes else "✗"
        return f"{statut} Module {self.module} — {self.date_appel:%d/%m/%Y %H:%M}"

class InteractionVocale(models.Model):
    """Historique des échanges avec le chatbot vocal, pour analyse et amélioration."""

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='interactions_vocales'
    )
    audio_question = models.FileField(upload_to='chatbot/questions/')
    transcription = models.TextField()
    reponse_texte = models.TextField()
    audio_reponse = models.FileField(upload_to='chatbot/reponses/')
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Interaction vocale"
        verbose_name_plural = "Interactions vocales"
        ordering = ['-date_creation']

    def __str__(self):
        return f"{self.utilisateur} — {self.date_creation:%d/%m/%Y %H:%M}"