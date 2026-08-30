from django.contrib.auth.models import AbstractUser
from django.db import models


class Utilisateur(AbstractUser):
    """
    Utilisateur de base de la plateforme ServConnect.
    Hérite de AbstractUser (username, email, password, first_name, last_name,
    is_staff, is_active, date_joined, ...) et ajoute les champs communs aux
    trois profils métier : Client, Prestataire, Administrateur.
    """

    class Role(models.TextChoices):
        CLIENT = 'client', 'Client'
        PRESTATAIRE = 'prestataire', 'Prestataire'
        ADMINISTRATEUR = 'administrateur', 'Administrateur'

    class Langue(models.TextChoices):
        FRANCAIS = 'fr', 'Français'
        ANGLAIS = 'en', 'English'

    telephone = models.CharField(
        max_length=20,
        unique=True,
        help_text="Format recommandé : +237XXXXXXXXX",
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    photo_profil = models.ImageField(upload_to='profils/', blank=True, null=True)
    date_naissance = models.DateField(blank=True, null=True)
    langue_preferee = models.CharField(
        max_length=2, choices=Langue.choices, default=Langue.FRANCAIS
    )
    telephone_verifie = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        ordering = ['-date_creation']

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"


class Client(models.Model):
    """Profil spécifique aux utilisateurs cherchant des services (rôle=client)."""

    utilisateur = models.OneToOneField(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='profil_client',
        limit_choices_to={'role': Utilisateur.Role.CLIENT},
    )
    adresse_habituelle = models.CharField(max_length=255, blank=True)
    nombre_demandes = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Client"
        verbose_name_plural = "Clients"

    def __str__(self):
        return f"Client : {self.utilisateur.get_full_name() or self.utilisateur.username}"


class Prestataire(models.Model):
    """Profil spécifique aux artisans / prestataires de services (rôle=prestataire)."""

    class StatutKYC(models.TextChoices):
        NON_SOUMIS = 'non_soumis', 'Non soumis'
        EN_ATTENTE = 'en_attente', 'En attente de vérification'
        VERIFIE = 'verifie', 'Vérifié'
        REJETE = 'rejete', 'Rejeté'

    utilisateur = models.OneToOneField(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='profil_prestataire',
        limit_choices_to={'role': Utilisateur.Role.PRESTATAIRE},
    )
    nom_entreprise = models.CharField(max_length=150, blank=True)
    description = models.TextField(blank=True)
    annees_experience = models.PositiveSmallIntegerField(blank=True, null=True)

    # Module IA #2 — KYC via analyse de pièce d'identité (Smile Identity)
    piece_identite_recto = models.ImageField(upload_to='kyc/', blank=True, null=True)
    piece_identite_verso = models.ImageField(upload_to='kyc/', blank=True, null=True)
    selfie_avec_piece = models.ImageField(
        upload_to='kyc/', blank=True, null=True,
        help_text="Photo du visage du prestataire tenant sa pièce d'identité.",
    )
    statut_kyc = models.CharField(
        max_length=20, choices=StatutKYC.choices, default=StatutKYC.NON_SOUMIS
    )
    kyc_commentaire = models.TextField(
        blank=True, help_text="Résultat/justification retourné par le service KYC"
    )

    # Statistiques agrégées (mises à jour depuis reviews.Avis)
    note_moyenne = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    nombre_avis = models.PositiveIntegerField(default=0)
    est_disponible = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Prestataire"
        verbose_name_plural = "Prestataires"

    def __str__(self):
        return self.nom_entreprise or self.utilisateur.get_full_name() or self.utilisateur.username


class Administrateur(models.Model):
    """Profil des membres de l'équipe Tech Temple gérant la plateforme."""

    class NiveauAcces(models.TextChoices):
        SUPPORT = 'support', 'Support / Modération'
        SUPER_ADMIN = 'super_admin', 'Super administrateur'

    utilisateur = models.OneToOneField(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='profil_administrateur',
        limit_choices_to={'role': Utilisateur.Role.ADMINISTRATEUR},
    )
    niveau_acces = models.CharField(
        max_length=20, choices=NiveauAcces.choices, default=NiveauAcces.SUPPORT
    )

    class Meta:
        verbose_name = "Administrateur"
        verbose_name_plural = "Administrateurs"

    def __str__(self):
        return f"Admin : {self.utilisateur.username} ({self.get_niveau_acces_display()})"