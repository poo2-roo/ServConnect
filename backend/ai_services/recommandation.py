import json

from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D

from .gemini_client import ErreurAppelIA, appeler_gemini
from .models import JournalAppelIA

PROMPT_TEMPLATE = """Tu es un moteur de recommandation pour ServConnect, une plateforme camerounaise de mise en relation avec des prestataires de services.

Voici un client à qui il faut recommander des services pertinents :
Catégories déjà appréciées par ce client (avis 4-5 étoiles donnés) : {categories_appreciees}

Voici la liste des services disponibles à proximité (n'utilise QUE les service_id listés ici, n'en invente aucun) :
{liste_services}

Choisis les {nombre_max} services les plus pertinents pour ce client et classe-les du plus au moins pertinent. Réponds UNIQUEMENT avec un JSON strict, sans texte avant ou après :

{{
  "recommandations": [
    {{"service_id": identifiant exact tiré de la liste ci-dessus, "score": nombre décimal entre 0 et 1, "raison": "courte explication en français"}}
  ]
}}

Si aucun service de la liste n'est pertinent, renvoie une liste "recommandations" vide."""


def recommander_services(client, latitude, longitude, rayon_km=10, nombre_max=5, utilisateur=None):
    """
    Recommande des services à un client, en combinant proximité géographique
    et historique de ses avis passés. Ne renvoie jamais que des services
    réellement existants (validation stricte des IDs renvoyés par Gemini).
    """
    from reviews.models import Avis
    from services.models import Service

    point_client = Point(float(longitude), float(latitude), srid=4326)

    candidats = list(
        Service.objects.filter(
            est_actif=True,
            localisation__point__distance_lte=(point_client, D(km=rayon_km)),
        )
        .select_related('categorie', 'prestataire')
        .annotate(distance=Distance('localisation__point', point_client))
        .order_by('distance')[:30]
    )

    if not candidats:
        return []

    categories_appreciees = list(
        Avis.objects.filter(client=client, note__gte=4)
        .values_list('prestataire__services__categorie__nom', flat=True)
        .distinct()
    )
    categories_appreciees = [c for c in categories_appreciees if c] or ["aucune donnée disponible"]

    liste_services_texte = "\n".join(
        f"- service_id={s.id} | {s.titre} | catégorie: {s.categorie.nom} | "
        f"prix: {s.prix_min} FCFA | note prestataire: {s.prestataire.note_moyenne}/5 | "
        f"distance: {s.distance.km:.1f} km"
        for s in candidats
    )

    prompt = PROMPT_TEMPLATE.format(
        categories_appreciees=", ".join(categories_appreciees),
        liste_services=liste_services_texte,
        nombre_max=nombre_max,
    )

    texte_reponse = appeler_gemini(
        prompt,
        module=JournalAppelIA.Module.RECOMMANDATION,
        utilisateur=utilisateur,
        reponse_json=True,
    )

    try:
        resultat = json.loads(texte_reponse)
    except (json.JSONDecodeError, TypeError) as exc:
        raise ErreurAppelIA(f"Réponse Gemini non-JSON pour le module recommandation : {exc}") from exc

    if 'recommandations' not in resultat:
        raise ErreurAppelIA("Champ 'recommandations' manquant dans la réponse Gemini.")

    candidats_par_id = {s.id: s for s in candidats}
    recommandations_validees = []

    for item in resultat['recommandations']:
        service = candidats_par_id.get(item.get('service_id'))
        if service is None:
            continue  # on ignore silencieusement tout ID halluciné ou invalide
        recommandations_validees.append({
            'service_id': service.id,
            'titre': service.titre,
            'prix_min': str(service.prix_min),
            'distance_km': round(service.distance.km, 1),
            'score': max(0.0, min(1.0, float(item.get('score', 0)))),
            'raison': item.get('raison', ''),
        })

    return recommandations_validees