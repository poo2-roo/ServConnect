import json

from .gemini_client import ErreurAppelIA, appeler_gemini
from .models import JournalAppelIA

PROMPT_TEMPLATE = """Tu es un rédacteur spécialisé dans la mise en valeur de prestataires de services camerounais (artisans, coiffeurs, mécaniciens, etc.) sur une plateforme de mise en relation.

Un prestataire souhaite rédiger la description de son service. Voici ce qu'il a fourni :

Catégorie : {categorie}
Titre provisoire : {titre}
Notes / mots-clés du prestataire : {notes_brutes}

Rédige 2 propositions de description professionnelle, honnête, claire et engageante pour ce service (chacune entre 40 et 100 mots), en français, adaptées au public camerounais. N'invente aucun détail factuel non mentionné par le prestataire (pas de faux diplômes, fausses années d'expérience, ou garanties non données). Réponds UNIQUEMENT avec un JSON strict, sans texte avant ou après :

{{
  "propositions": [
    {{"style": "court nom du style, ex: Professionnel et rassurant", "texte": "la description proposée"}}
  ]
}}"""


def rediger_description(categorie_nom, titre, notes_brutes, utilisateur=None):
    """
    Génère 2 propositions de description de service à partir de notes brutes
    fournies par le prestataire. Ne modifie aucune donnée en base — c'est au
    prestataire de choisir puis d'enregistrer via l'endpoint service classique.
    """
    if not notes_brutes or not notes_brutes.strip():
        raise ErreurAppelIA("Merci de fournir quelques notes ou mots-clés décrivant le service.")

    prompt = PROMPT_TEMPLATE.format(
        categorie=categorie_nom,
        titre=titre or "non précisé",
        notes_brutes=notes_brutes.strip(),
    )

    texte_reponse = appeler_gemini(
        prompt,
        module=JournalAppelIA.Module.REDACTION_CONTENU,
        utilisateur=utilisateur,
        reponse_json=True,
    )

    try:
        resultat = json.loads(texte_reponse)
    except (json.JSONDecodeError, TypeError) as exc:
        raise ErreurAppelIA(f"Réponse Gemini non-JSON pour le module rédaction contenu : {exc}") from exc

    if 'propositions' not in resultat:
        raise ErreurAppelIA("Champ 'propositions' manquant dans la réponse Gemini.")

    return resultat['propositions']