from django.conf import settings
from django.db import models


class Publication(models.Model):
    """Post publié par un prestataire : annonce, promo, actualité de son activité."""

    class TypePublication(models.TextChoices):
        ANNONCE = 'annonce', 'Annonce'
        PROMOTION = 'promotion', 'Promotion'
        ACTUALITE = 'actualite', 'Actualité'

    prestataire = models.ForeignKey(
        'accounts.Prestataire', on_delete=models.CASCADE, related_name='publications'
    )
    type_publication = models.CharField(
        max_length=20, choices=TypePublication.choices, default=TypePublication.ACTUALITE
    )
    contenu = models.TextField()
    image = models.ImageField(upload_to='publications/', blank=True, null=True)
    service_associe = models.ForeignKey(
        'services.Service', on_delete=models.SET_NULL, blank=True, null=True, related_name='publications'
    )

    utilisateurs_ayant_aime = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name='publications_aimees', blank=True
    )

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Publication"
        verbose_name_plural = "Publications"
        ordering = ['-date_creation']

    def __str__(self):
        return f"Publication de {self.prestataire} — {self.date_creation:%d/%m/%Y}"

    @property
    def nombre_likes(self):
        return self.utilisateurs_ayant_aime.count()


class Commentaire(models.Model):
    """Commentaire laissé par un utilisateur (client ou prestataire) sur une publication."""

    publication = models.ForeignKey(Publication, on_delete=models.CASCADE, related_name='commentaires')
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='commentaires_publications'
    )
    contenu = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Commentaire"
        verbose_name_plural = "Commentaires"
        ordering = ['date_creation']

    def __str__(self):
        return f"Commentaire de {self.auteur} sur publication #{self.publication_id}"