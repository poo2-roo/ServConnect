import json
import uuid
from io import BytesIO

from django.core.files.base import ContentFile
from gtts import gTTS

from .gemini_client import ErreurAppelIA, appeler_gemini
from .models import JournalAppelIA

PROMPT_TEMPLATE = """Tu es l'assistant vocal de ServConnect, une plateforme camerounaise qui met en relation des clients avec des prestataires de services (plombiers, électriciens, coiffeurs, mécaniciens...) à Douala, Yaoundé et d'autres villes.

Un utilisateur t'a envoyé un message vocal (fichier audio joint). Écoute-le et réponds à sa question ou sa demande, de façon utile, courte et orale (comme si tu parlais à voix haute, pas comme un texte écrit).

Si la question sort du cadre de ServConnect (trouver un prestataire, comprendre le fonctionnement de la plateforme, poser une question sur un service), réponds poliment que tu es limité à l'assistance ServConnect.

Réponds UNIQUEMENT avec un JSON strict, sans texte avant ou après :

{{
  "transcription": "ce que l'utilisateur a dit, transcrit en texte",
  "reponse_texte": "ta réponse orale, en français, moins de 80 mots"
}}"""


def traiter_question_vocale(audio_bytes, audio_mime_type='audio/mp3', utilisateur=None):
    """
    Pipeline complet du chatbot vocal :
    1. Envoie l'audio à Gemini, qui transcrit ET répond en un seul appel
    2. Convertit la réponse texte en audio via gTTS (gratuit)
    Renvoie {transcription, reponse_texte, fichier_audio_reponse}
    """
    texte_reponse = appeler_gemini(
        PROMPT_TEMPLATE,
        module=JournalAppelIA.Module.CHATBOT_VOCAL,
        utilisateur=utilisateur,
        reponse_json=True,
        audio_bytes=audio_bytes,
        audio_mime_type=audio_mime_type,
    )

    try:
        resultat = json.loads(texte_reponse)
    except (json.JSONDecodeError, TypeError) as exc:
        raise ErreurAppelIA(f"Réponse Gemini non-JSON pour le module chatbot vocal : {exc}") from exc

    for champ in ('transcription', 'reponse_texte'):
        if champ not in resultat:
            raise ErreurAppelIA(f"Champ manquant '{champ}' dans la réponse Gemini (chatbot vocal).")

    try:
        tts = gTTS(text=resultat['reponse_texte'], lang='fr')
        tampon = BytesIO()
        tts.write_to_fp(tampon)
        tampon.seek(0)
    except Exception as exc:
        raise ErreurAppelIA(f"Échec de la synthèse vocale (gTTS) : {exc}") from exc

    nom_fichier = f"reponse_{uuid.uuid4().hex[:8]}.mp3"
    fichier_audio = ContentFile(tampon.read(), name=nom_fichier)

    return {
        'transcription': resultat['transcription'],
        'reponse_texte': resultat['reponse_texte'],
        'fichier_audio_reponse': fichier_audio,
    }