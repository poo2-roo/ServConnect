from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Avis(models.Model):
    """Note et commentaire laissés par un client suite à une prestation."""

    client = models.ForeignKey(
        'accounts.Client', on_delete=models.CASCADE, related_name='avis_donnes'
    )
    prestataire = models.ForeignKey(
        'accounts.Prestataire', on_delete=models.CASCADE, related_name='avis_recus'
    )
    service = models.ForeignKey(
        'services.Service', on_delete=models.SET_NULL,
        blank=True, null=True, related_name='avis',
    )

    note = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    commentaire = models.TextField(blank=True)
    reponse_prestataire = models.TextField(
        blank=True, help_text="Réponse publique du prestataire à cet avis."
    )

    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Avis"
        verbose_name_plural = "Avis"
        ordering = ['-date_creation']
        constraints = [
            models.UniqueConstraint(
                fields=['client', 'service'], name='un_seul_avis_par_service_client'
            )
        ]

    def __str__(self):
        return f"{self.note}/5 — {self.prestataire} par {self.client}"