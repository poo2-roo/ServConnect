import json

from .gemini_client import ErreurAppelIA, appeler_gemini
from .models import JournalAppelIA

PROMPT_TEMPLATE = """Tu es un assistant spécialisé dans la compréhension des adresses informelles au Cameroun (villes : Douala, Yaoundé, Bafoussam, Garoua, Bamenda...).

Un utilisateur a décrit l'emplacement d'un commerce ou d'un artisan avec ce texte, éventuellement flou ou familier :

"{adresse_texte}"

Ville indiquée : {ville}
Quartier indiqué : {quartier}

Analyse ce texte et réponds UNIQUEMENT avec un objet JSON strict au format suivant, sans aucun texte avant ou après :

{{
  "adresse_normalisee": "une reformulation claire et structurée de l'adresse, en français, mentionnant les points de repère",
  "points_de_repere": ["liste des lieux ou repères mentionnés, ex: pharmacie, carrefour, église"],
  "confiance": nombre décimal entre 0 et 1 représentant à quel point l'adresse est précise et exploitable pour la retrouver physiquement,
  "raison_confiance": "courte explication en français de ce score de confiance"
}}

Si le texte est trop vague pour être exploité (ex: "à Douala" sans autre précision), donne un score de confiance faible (inférieur à 0.3) et explique pourquoi dans raison_confiance."""


def analyser_adresse(adresse_texte, ville='', quartier='', utilisateur=None):
    """
    Envoie une adresse informelle à Gemini pour extraction structurée.
    Renvoie un dict : {adresse_normalisee, points_de_repere, confiance, raison_confiance}
    Lève ErreurAppelIA si Gemini échoue ou renvoie un JSON invalide/incomplet.
    """
    prompt = PROMPT_TEMPLATE.format(
        adresse_texte=adresse_texte.strip(),
        ville=ville or "non précisée",
        quartier=quartier or "non précisé",
    )

    texte_reponse = appeler_gemini(
        prompt,
        module=JournalAppelIA.Module.NLP_ADRESSES,
        utilisateur=utilisateur,
        reponse_json=True,
    )

    try:
        resultat = json.loads(texte_reponse)
    except (json.JSONDecodeError, TypeError) as exc:
        raise ErreurAppelIA(f"Réponse Gemini non-JSON pour le module NLP adresses : {exc}") from exc

    for champ in ('adresse_normalisee', 'points_de_repere', 'confiance'):
        if champ not in resultat:
            raise ErreurAppelIA(f"Champ manquant '{champ}' dans la réponse Gemini (NLP adresses).")

    resultat['confiance'] = max(0.0, min(1.0, float(resultat['confiance'])))
    return resultat