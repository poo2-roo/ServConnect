import json
from datetime import datetime

from .gemini_client import ErreurAppelIA, appeler_gemini
from .models import JournalAppelIA

PROMPT_TEMPLATE = """Tu es un assistant qui aide à estimer des temps de trajet dans les villes camerounaises (Douala, Yaoundé...), en te basant sur ta connaissance générale des conditions de circulation locales (embouteillages aux heures de pointe, état des routes selon les quartiers, moyens de transport courants comme les moto-taxis).

Distance à vol d'oiseau entre le client et le prestataire : {distance_km} km
Ville : {ville}
Heure actuelle : {heure} ({jour_semaine})
Mode de transport probable : {mode_transport}

IMPORTANT : tu n'as pas accès aux données de trafic en temps réel. Donne une ESTIMATION raisonnable basée sur des conditions typiques, pas une prédiction précise.

Réponds UNIQUEMENT avec un JSON strict, sans texte avant ou après :

{{
  "eta_minutes_min": nombre entier (estimation basse),
  "eta_minutes_max": nombre entier (estimation haute),
  "conditions_estimees": "courte description en français des conditions de circulation supposées (ex: heure de pointe probable, route généralement fluide...)",
  "avertissement": "rappel court que c'est une estimation, pas un calcul en temps réel"
}}"""


def estimer_eta(distance_km, ville, mode_transport='moto-taxi', utilisateur=None):
    """
    Estime une fourchette de temps de trajet à partir d'une distance réelle
    (calculée par PostGIS en amont) et du contexte local. Ne remplace pas un
    vrai moteur de routage — voir avertissement retourné à l'utilisateur.
    """
    maintenant = datetime.now()

    prompt = PROMPT_TEMPLATE.format(
        distance_km=round(distance_km, 1),
        ville=ville,
        heure=maintenant.strftime('%Hh%M'),
        jour_semaine=maintenant.strftime('%A'),
        mode_transport=mode_transport,
    )

    texte_reponse = appeler_gemini(
        prompt,
        module=JournalAppelIA.Module.ROUTAGE_ETA,
        utilisateur=utilisateur,
        reponse_json=True,
    )

    try:
        resultat = json.loads(texte_reponse)
    except (json.JSONDecodeError, TypeError) as exc:
        raise ErreurAppelIA(f"Réponse Gemini non-JSON pour le module routage/ETA : {exc}") from exc

    for champ in ('eta_minutes_min', 'eta_minutes_max'):
        if champ not in resultat:
            raise ErreurAppelIA(f"Champ manquant '{champ}' dans la réponse Gemini (routage/ETA).")

    resultat['distance_km'] = round(distance_km, 1)
    return resultat