import json

from .gemini_client import ErreurAppelIA, appeler_gemini
from .models import JournalAppelIA

PROMPT_TEMPLATE = """Tu es un expert du marché des services informels au Cameroun (artisanat, réparation, beauté, transport...), avec une bonne connaissance des prix pratiqués à Douala, Yaoundé et dans les autres grandes villes.

Voici un service proposé par un prestataire sur une plateforme de mise en relation :

Catégorie : {categorie}
Titre : {titre}
Description : {description}
Ville : {ville}
Années d'expérience du prestataire : {experience}
Prix actuellement demandé par le prestataire : {prix_min} à {prix_max} FCFA ({unite_prix})

Analyse ce service et propose un prix juste, réaliste pour le marché camerounais actuel. Réponds UNIQUEMENT avec un JSON strict, sans texte avant ou après :

{{
  "prix_suggere": nombre entier en FCFA représentant le prix idéal pour ce service,
  "fourchette_basse": nombre entier (prix minimum raisonnable),
  "fourchette_haute": nombre entier (prix maximum raisonnable),
  "justification": "courte explication en français du prix suggéré, tenant compte de la catégorie, la ville et l'expérience",
  "confiance": nombre décimal entre 0 et 1 représentant la certitude de cette estimation
}}

Si les informations fournies sont insuffisantes pour une estimation fiable (description trop vague), donne quand même une estimation mais avec une confiance faible (inférieure à 0.4), et explique pourquoi dans la justification."""


def optimiser_prix(service, utilisateur=None):
    """
    Envoie les caractéristiques d'un service à Gemini pour obtenir une
    suggestion de prix, met à jour service.prix_suggere_ia, et renvoie le
    détail de l'analyse (fourchette, justification, confiance).
    """
    prompt = PROMPT_TEMPLATE.format(
        categorie=service.categorie.nom,
        titre=service.titre,
        description=service.description,
        ville=service.localisation.get_ville_display() if service.localisation else "non précisée",
        experience=service.prestataire.annees_experience or "non précisé",
        prix_min=service.prix_min,
        prix_max=service.prix_max or service.prix_min,
        unite_prix=service.get_unite_prix_display(),
    )

    texte_reponse = appeler_gemini(
        prompt,
        module=JournalAppelIA.Module.OPTIMISATION_PRIX,
        utilisateur=utilisateur,
        reponse_json=True,
    )

    try:
        resultat = json.loads(texte_reponse)
    except (json.JSONDecodeError, TypeError) as exc:
        raise ErreurAppelIA(f"Réponse Gemini non-JSON pour le module optimisation prix : {exc}") from exc

    for champ in ('prix_suggere', 'fourchette_basse', 'fourchette_haute', 'confiance'):
        if champ not in resultat:
            raise ErreurAppelIA(f"Champ manquant '{champ}' dans la réponse Gemini (optimisation prix).")

    resultat['confiance'] = max(0.0, min(1.0, float(resultat['confiance'])))

    service.prix_suggere_ia = resultat['prix_suggere']
    service.save(update_fields=['prix_suggere_ia'])

    return resultat