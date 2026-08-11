from django.contrib.gis.db import models


class Localisation(models.Model):
    """
    Une structure physique (boutique, atelier, salon, domicile...) d'où un
    prestataire exerce. Un même prestataire peut déclarer plusieurs structures.

    `adresse_texte` conserve la description libre saisie par l'utilisateur
    (ex : "derrière la pharmacie Saker, Akwa") — c'est l'entrée du module IA
    n°1 (NLP de compréhension des adresses locales), qui produit ensuite
    `point` (coordonnées GPS) et `adresse_normalisee`.
    """

    class TypeStructure(models.TextChoices):
        BOUTIQUE = 'boutique', 'Boutique'
        ATELIER = 'atelier', 'Atelier'
        SALON = 'salon', 'Salon'
        GARAGE = 'garage', 'Garage'
        DOMICILE = 'domicile', 'Domicile'
        AUTRE = 'autre', 'Autre'

    class Ville(models.TextChoices):
        DOUALA = 'douala', 'Douala'
        YAOUNDE = 'yaounde', 'Yaoundé'
        BAFOUSSAM = 'bafoussam', 'Bafoussam'
        GAROUA = 'garoua', 'Garoua'
        BAMENDA = 'bamenda', 'Bamenda'
        AUTRE = 'autre', 'Autre'

    prestataire = models.ForeignKey(
        'accounts.Prestataire',
        on_delete=models.CASCADE,
        related_name='localisations',
    )
    nom_structure = models.CharField(max_length=150, blank=True)
    type_structure = models.CharField(
        max_length=20, choices=TypeStructure.choices, default=TypeStructure.AUTRE
    )

    # Entrée utilisateur brute (texte ou transcription vocale)
    adresse_texte = models.TextField(
        help_text="Description libre de l'adresse telle que fournie par l'utilisateur."
    )
    quartier = models.CharField(max_length=100, blank=True)
    ville = models.CharField(max_length=20, choices=Ville.choices, default=Ville.DOUALA)

    # Sortie du module IA n°1 (NLP)
    adresse_normalisee = models.TextField(
        blank=True, help_text="Adresse structurée générée par le module NLP."
    )
    point = models.PointField(
        geography=True, srid=4326, blank=True, null=True,
        help_text="Coordonnées GPS (longitude, latitude).",
    )
    confiance_geocodage = models.FloatField(
        blank=True, null=True,
        help_text="Score de confiance (0-1) retourné par le module IA de géocodage.",
    )

    est_verifiee = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Localisation"
        verbose_name_plural = "Localisations"
        indexes = [models.Index(fields=['ville', 'quartier'])]

    def __str__(self):
        return f"{self.nom_structure or self.get_type_structure_display()} — {self.quartier}, {self.get_ville_display()}"
