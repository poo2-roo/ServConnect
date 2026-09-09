import json
from .gemini_client import ErreurAppelIA, appeler_gemini
from .models import JournalAppelIA

PROMPT_TEMPLATE = """Tu es l'assistant de recherche de ServConnect, une plateforme camerounaise qui connecte des clients a des prestataires de services (plombiers, electriciens, coiffeurs, mecaniciens, etc.).

Voici la liste des categories disponibles :
{liste_categories}

Le client decrit son besoin ainsi : "{message}"

Identifie la categorie la plus pertinente (utilise EXACTEMENT le nom tel qu'il apparait dans la liste). Reponds UNIQUEMENT avec un JSON strict :

{{
  "categorie_nom": "nom exact de la categorie choisie, ou null si aucune ne correspond",
  "reponse_texte": "courte reponse expliquant ton choix, en francais, moins de 40 mots"
}}"""


def trouver_categorie(message, categories, utilisateur=None):
    liste_categories = "\n".join(f"- {c.nom}" for c in categories)
    prompt = PROMPT_TEMPLATE.format(liste_categories=liste_categories, message=message)

    texte_reponse = appeler_gemini(
        prompt, module=JournalAppelIA.Module.RECOMMANDATION,
        utilisateur=utilisateur, reponse_json=True,
    )

    try:
        resultat = json.loads(texte_reponse)
    except (json.JSONDecodeError, TypeError) as exc:
        raise ErreurAppelIA(f"Reponse Gemini non-JSON : {exc}") from exc

    if 'reponse_texte' not in resultat:
        raise ErreurAppelIA("Champ 'reponse_texte' manquant.")

    categorie_trouvee = None
    nom_categorie = resultat.get('categorie_nom')
    if nom_categorie:
        for c in categories:
            if c.nom.lower() == str(nom_categorie).lower():
                categorie_trouvee = c
                break

    return {
        'categorie_id': categorie_trouvee.id if categorie_trouvee else None,
        'categorie_nom': categorie_trouvee.nom if categorie_trouvee else None,
        'reponse_texte': resultat['reponse_texte'],
    }