from django.db.models import Avg, Count
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Avis


@receiver([post_save, post_delete], sender=Avis)
def mettre_a_jour_note_prestataire(sender, instance, **kwargs):
    """Recalcule note_moyenne et nombre_avis du prestataire à chaque création/suppression d'avis."""
    prestataire = instance.prestataire
    stats = Avis.objects.filter(prestataire=prestataire).aggregate(
        moyenne=Avg('note'), total=Count('id')
    )
    prestataire.note_moyenne = stats['moyenne'] or 0
    prestataire.nombre_avis = stats['total']
    prestataire.save(update_fields=['note_moyenne', 'nombre_avis'])