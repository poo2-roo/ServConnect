from django.db import models


class Categorie(models.Model):
    """Catégorie de service : électricité, plomberie, coiffure, mécanique, etc."""

    nom = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icone = models.CharField(
        max_length=50, blank=True,
        help_text="Nom d'icône (ex : lucide-react-native) utilisé côté frontend.",
    )
    categorie_parente = models.ForeignKey(
        'self', on_delete=models.SET_NULL, blank=True, null=True,
        related_name='sous_categories',
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        ordering = ['nom']

    def __str__(self):
        return self.nom


class Service(models.Model):
    """Une offre de service publiée par un prestataire."""

    class UnitePrix(models.TextChoices):
        FORFAIT = 'forfait', 'Forfait'
        HEURE = 'heure', 'Par heure'
        JOUR = 'jour', 'Par jour'
        METRE_CARRE = 'metre_carre', 'Par m²'

    prestataire = models.ForeignKey(
        'accounts.Prestataire', on_delete=models.CASCADE, related_name='services'
    )
    categorie = models.ForeignKey(
        Categorie, on_delete=models.PROTECT, related_name='services'
    )
    localisation = models.ForeignKey(
        'geolocation.Localisation', on_delete=models.SET_NULL,
        blank=True, null=True, related_name='services',
        help_text="Structure depuis laquelle ce service est proposé.",
    )

    titre = models.CharField(max_length=150)
    description = models.TextField()

    # Module IA n°7 — Optimisation des prix (prix_suggere_ia rempli par le module)
    prix_min = models.DecimalField(max_digits=10, decimal_places=0)
    prix_max = models.DecimalField(max_digits=10, decimal_places=0, blank=True, null=True)
    unite_prix = models.CharField(
        max_length=20, choices=UnitePrix.choices, default=UnitePrix.FORFAIT
    )
    prix_suggere_ia = models.DecimalField(
        max_digits=10, decimal_places=0, blank=True, null=True,
        help_text="Prix idéal suggéré par le module IA d'analyse prédictive des prix.",
    )

    est_actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Service"
        verbose_name_plural = "Services"
        ordering = ['-date_creation']
        indexes = [models.Index(fields=['categorie', 'est_actif'])]

    def __str__(self):
        return f"{self.titre} ({self.prestataire})"


class ServiceImage(models.Model):
    """
    Photo associée à un service. `image_originale` est le fichier envoyé par
    le prestataire ; `image_amelioree` est le résultat du module IA n°8
    (retouche/amélioration visuelle via Gemini).
    """

    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='images')
    image_originale = models.ImageField(upload_to='services/originales/')
    image_amelioree = models.ImageField(
        upload_to='services/ameliorees/', blank=True, null=True
    )
    est_principale = models.BooleanField(default=False)
    date_ajout = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Image de service"
        verbose_name_plural = "Images de service"
        ordering = ['-est_principale', 'date_ajout']

    def __str__(self):
        return f"Image de « {self.service.titre} »"