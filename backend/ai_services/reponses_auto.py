import json

from .gemini_client import ErreurAppelIA, appeler_gemini
from .models import JournalAppelIA

PROMPT_TEMPLATE = """Tu es un assistant qui aide des prestataires de services camerounais (plombiers, électriciens, coiffeurs...) à répondre rapidement et professionnellement à leurs clients sur une messagerie.

Voici l'historique récent d'une conversation, du plus ancien au plus récent :
{historique}

Le dernier message vient du client et attend une réponse du prestataire ({nom_prestataire}).

Propose 3 réponses courtes et professionnelles que le prestataire pourrait envoyer, dans des tons différents (par exemple : une réponse rapide/directe, une réponse détaillée, une réponse qui pose une question de clarification). Réponds UNIQUEMENT avec un JSON strict, sans texte avant ou après :

{{
  "suggestions": [
    {{"ton": "court nom du ton, ex: Direct", "texte": "le message suggéré en français"}}
  ]
}}

Les messages doivent être écrits à la première personne (comme si c'était le prestataire qui parlait), rester courts (moins de 300 caractères), polis, et adaptés au contexte camerounais."""


def suggerer_reponses(conversation, utilisateur=None):
    """
    Analyse les 10 derniers messages d'une conversation et suggère 3 réponses
    possibles pour le prestataire. Ne sauvegarde rien automatiquement — le
    prestataire choisit et envoie lui-même via l'endpoint messages classique.
    """
    derniers_messages = list(conversation.messages.select_related('expediteur').order_by('-date_envoi')[:10])
    derniers_messages.reverse()

    if not derniers_messages:
        raise ErreurAppelIA("Cette conversation ne contient encore aucun message.")

    nom_prestataire = (
        conversation.prestataire.nom_entreprise
        or conversation.prestataire.utilisateur.get_full_name()
        or "le prestataire"
    )

    lignes_historique = []
    for msg in derniers_messages:
        role = "Prestataire" if msg.expediteur_id == conversation.prestataire.utilisateur_id else "Client"
        lignes_historique.append(f"{role} : {msg.contenu}")

    prompt = PROMPT_TEMPLATE.format(
        historique="\n".join(lignes_historique),
        nom_prestataire=nom_prestataire,
    )

    texte_reponse = appeler_gemini(
        prompt,
        module=JournalAppelIA.Module.REPONSES_AUTO,
        utilisateur=utilisateur,
        reponse_json=True,
    )

    try:
        resultat = json.loads(texte_reponse)
    except (json.JSONDecodeError, TypeError) as exc:
        raise ErreurAppelIA(f"Réponse Gemini non-JSON pour le module réponses auto : {exc}") from exc

    if 'suggestions' not in resultat:
        raise ErreurAppelIA("Champ 'suggestions' manquant dans la réponse Gemini.")

    return resultat['suggestions']