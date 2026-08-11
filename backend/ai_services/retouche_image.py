import time
from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image, ImageEnhance, ImageOps

from .gemini_client import ErreurAppelIA
from .models import JournalAppelIA


def ameliorer_image_service(service_image, utilisateur=None):
    """
    Améliore automatiquement une photo de service : correction du contraste,
    légère augmentation de netteté et de saturation. Traitement 100% local
    (Pillow), sans appel à un service IA payant.
    """
    if not service_image.image_originale:
        raise ErreurAppelIA("Aucune image originale à améliorer.")

    debut = time.monotonic()
    journal = JournalAppelIA(
        utilisateur=utilisateur,
        module=JournalAppelIA.Module.RETOUCHE_IMAGE,
        modele_utilise='pillow-local',
    )

    try:
        service_image.image_originale.seek(0)
        image = Image.open(service_image.image_originale).convert('RGB')

        image = ImageOps.autocontrast(image, cutoff=1)
        image = ImageEnhance.Sharpness(image).enhance(1.3)
        image = ImageEnhance.Color(image).enhance(1.15)
        image = ImageEnhance.Brightness(image).enhance(1.05)

        tampon = BytesIO()
        image.save(tampon, format='JPEG', quality=90)
        tampon.seek(0)

        nom_fichier = f"amelioree_{service_image.id}.jpg"
        service_image.image_amelioree.save(nom_fichier, ContentFile(tampon.read()), save=True)

        journal.duree_ms = int((time.monotonic() - debut) * 1000)
        journal.succes = True
        journal.save()

        return service_image

    except Exception as exc:
        journal.duree_ms = int((time.monotonic() - debut) * 1000)
        journal.succes = False
        journal.message_erreur = str(exc)[:2000]
        journal.save()
        raise ErreurAppelIA(f"Échec de l'amélioration d'image : {exc}") from exc