import json

from .gemini_client import ErreurAppelIA, appeler_gemini
from .models import JournalAppelIA

PROMPT_TEMPLATE = """Tu es un rédacteur spécialisé dans les réseaux sociaux pour des prestataires de services camerounais (artisans, coiffeurs, mécaniciens...).

Type de publication : {type_publication}
Notes du prestataire : {notes_brutes}

Rédige une légende captivante et professionnelle pour cette publication (entre 20 et 60 mots), en français, avec un ton engageant adapté au public camerounais. N'invente aucun détail factuel non mentionné. Réponds UNIQUEMENT avec un JSON strict, sans texte avant ou après :

{{"legende": "le texte propose"}}"""


def generer_legende(type_publication, notes_brutes, utilisateur=None):
    if not notes_brutes or not notes_brutes.strip():
        raise ErreurAppelIA("Merci de donner quelques mots-clés pour générer une légende.")

    prompt = PROMPT_TEMPLATE.format(type_publication=type_publication, notes_brutes=notes_brutes.strip())

    texte_reponse = appeler_gemini(
        prompt, module=JournalAppelIA.Module.REDACTION_CONTENU,
        utilisateur=utilisateur, reponse_json=True,
    )

    try:
        resultat = json.loads(texte_reponse)
    except (json.JSONDecodeError, TypeError) as exc:
        raise ErreurAppelIA(f"Réponse Gemini non-JSON pour la légende : {exc}") from exc

    if 'legende' not in resultat:
        raise ErreurAppelIA("Champ 'legende' manquant dans la réponse Gemini.")

    return resultat['legende']