import time
from urllib.parse import quote

import requests
from django.core.files.base import ContentFile

from .gemini_client import ErreurAppelIA
from .models import JournalAppelIA

POLLINATIONS_URL = "https://image.pollinations.ai/prompt/{prompt}"


def generer_image_illustrative(service, utilisateur=None):
    """
    Génère une image illustrative pour un service à partir de son titre et
    sa catégorie, via Pollinations.ai (FLUX, gratuit, sans clé API). Utile
    quand le prestataire n'a pas encore de vraie photo à proposer.
    """
    prompt_texte = (
        f"professional photo of {service.categorie.nom} service in Cameroon, "
        f"{service.titre}, realistic, high quality, natural lighting"
    )
    url = POLLINATIONS_URL.format(prompt=quote(prompt_texte)) + "?width=1024&height=768&nologo=true"

    debut = time.monotonic()
    journal = JournalAppelIA(
        utilisateur=utilisateur,
        module=JournalAppelIA.Module.RETOUCHE_IMAGE,
        modele_utilise='pollinations-flux',
    )

    try:
        reponse = requests.get(url, timeout=30)
        reponse.raise_for_status()

        journal.duree_ms = int((time.monotonic() - debut) * 1000)
        journal.succes = True
        journal.save()

        return ContentFile(reponse.content, name=f"generee_service_{service.id}.jpg")

    except requests.RequestException as exc:
        journal.duree_ms = int((time.monotonic() - debut) * 1000)
        journal.succes = False
        journal.message_erreur = str(exc)[:2000]
        journal.save()
        raise ErreurAppelIA(f"Échec de la génération d'image : {exc}") from exc