import time

import google.generativeai as genai
from django.conf import settings

from .models import JournalAppelIA

genai.configure(api_key=settings.GEMINI_API_KEY)

MODELE_PAR_DEFAUT = 'gemini-3.5-flash-lite'
MODELE_IMAGE_PAR_DEFAUT = 'gemini-3.1-flash-lite-image'


class ErreurAppelIA(Exception):
    """Levée quand l'appel à Gemini échoue ou renvoie une réponse inexploitable."""


def appeler_gemini(
    prompt, module, utilisateur=None, reponse_json=False, modele=MODELE_PAR_DEFAUT,
    image_bytes=None, image_mime_type='image/jpeg',
    audio_bytes=None, audio_mime_type='audio/mp3',
):
    """
    Appelle Gemini avec un prompt texte, et optionnellement une image OU un
    fichier audio (modules multimodaux : KYC pour l'image, chatbot vocal
    pour l'audio). Journalise l'appel dans JournalAppelIA.
    """

    config_generation = {}
    if reponse_json:
        config_generation['response_mime_type'] = 'application/json'

    contenu = [prompt]
    if image_bytes is not None:
        contenu.append({'mime_type': image_mime_type, 'data': image_bytes})
    if audio_bytes is not None:
        contenu.append({'mime_type': audio_mime_type, 'data': audio_bytes})

    debut = time.monotonic()
    journal = JournalAppelIA(
        utilisateur=utilisateur,
        module=module,
        modele_utilise=modele,
    )

    try:
        model = genai.GenerativeModel(modele)
        reponse = model.generate_content(contenu, generation_config=config_generation)

        journal.duree_ms = int((time.monotonic() - debut) * 1000)
        usage = getattr(reponse, 'usage_metadata', None)
        if usage:
            journal.tokens_entree = usage.prompt_token_count or 0
            journal.tokens_sortie = usage.candidates_token_count or 0
        journal.succes = True
        journal.save()

        return reponse.text

    except Exception as exc:
        journal.duree_ms = int((time.monotonic() - debut) * 1000)
        journal.succes = False
        journal.message_erreur = str(exc)[:2000]
        journal.save()
        raise ErreurAppelIA(f"Échec de l'appel Gemini (module {module}) : {exc}") from exc


def appeler_gemini_image(prompt, image_bytes, module, utilisateur=None, modele=MODELE_IMAGE_PAR_DEFAUT, image_mime_type='image/jpeg'):
    """
    Envoie une image existante à Gemini avec une instruction de retouche
    (ex: "améliore la luminosité et le cadrage"), et renvoie les octets de
    la nouvelle image générée. Journalise l'appel comme les autres modules.
    """

    debut = time.monotonic()
    journal = JournalAppelIA(
        utilisateur=utilisateur,
        module=module,
        modele_utilise=modele,
    )

    try:
        model = genai.GenerativeModel(modele)
        reponse = model.generate_content([
            prompt,
            {'mime_type': image_mime_type, 'data': image_bytes},
        ])

        journal.duree_ms = int((time.monotonic() - debut) * 1000)
        usage = getattr(reponse, 'usage_metadata', None)
        if usage:
            journal.tokens_entree = usage.prompt_token_count or 0
            journal.tokens_sortie = usage.candidates_token_count or 0

        image_resultat = None
        for part in reponse.candidates[0].content.parts:
            if getattr(part, 'inline_data', None) is not None:
                image_resultat = part.inline_data.data
                break

        if image_resultat is None:
            raise ErreurAppelIA("Gemini n'a renvoyé aucune image dans sa réponse.")

        journal.succes = True
        journal.save()
        return image_resultat

    except ErreurAppelIA:
        journal.duree_ms = int((time.monotonic() - debut) * 1000)
        journal.succes = False
        journal.message_erreur = "Aucune image dans la réponse Gemini."
        journal.save()
        raise

    except Exception as exc:
        journal.duree_ms = int((time.monotonic() - debut) * 1000)
        journal.succes = False
        journal.message_erreur = str(exc)[:2000]
        journal.save()
        raise ErreurAppelIA(f"Échec de l'appel Gemini image (module {module}) : {exc}") from exc