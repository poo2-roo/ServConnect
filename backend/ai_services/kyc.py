import json

from .gemini_client import ErreurAppelIA, appeler_gemini
from .models import JournalAppelIA

PROMPT_KYC = """Tu es un assistant qui aide à vérifier des documents d'identité pour l'inscription de prestataires de services sur une plateforme camerounaise.

Deux images sont jointes :
1. La pièce d'identité (carte nationale d'identité, passeport, ou permis de conduire)
2. Un selfie de la personne tenant cette même pièce d'identité près de son visage

Analyse les deux images ensemble. Réponds UNIQUEMENT avec un JSON strict, sans texte avant ou après :

{
  "document_lisible": true ou false,
  "type_document_detecte": "carte_identite" ou "passeport" ou "permis_conduire" ou "autre" ou "illisible",
  "nom_complet_detecte": "nom tel que lu sur le document, ou chaîne vide si illisible",
  "date_naissance_detectee": "JJ/MM/AAAA ou chaîne vide",
  "selfie_correspond_document": true ou false ou null si impossible à déterminer,
  "raison_correspondance": "courte explication de pourquoi le visage correspond ou non au document",
  "signes_suspects": ["liste de signes potentiels de falsification ou d'anomalie, tableau vide si rien détecté"],
  "recommandation": "approuver" ou "rejeter" ou "verification_manuelle",
  "justification": "courte explication en français de la recommandation"
}

Sois prudent : en cas de moindre doute sur l'authenticité du document OU sur la correspondance entre le visage et le document, préfère "verification_manuelle" plutôt que "approuver". Ne jamais inventer d'informations qui ne sont pas clairement visibles."""


def verifier_identite(prestataire, utilisateur=None):
    """
    Analyse la pièce d'identité (recto) ET le selfie du prestataire via
    Gemini vision, compare les deux, met à jour son statut_kyc, et renvoie
    le détail de l'analyse.
    """
    if not prestataire.piece_identite_recto:
        raise ErreurAppelIA("Aucune pièce d'identité (recto) n'a été téléversée.")
    if not prestataire.selfie_avec_piece:
        raise ErreurAppelIA("Aucun selfie avec la pièce d'identité n'a été téléversé.")

    prestataire.piece_identite_recto.seek(0)
    image_carte = prestataire.piece_identite_recto.read()
    prestataire.piece_identite_recto.seek(0)

    prestataire.selfie_avec_piece.seek(0)
    image_selfie = prestataire.selfie_avec_piece.read()
    prestataire.selfie_avec_piece.seek(0)

    texte_reponse = appeler_gemini(
        PROMPT_KYC,
        module=JournalAppelIA.Module.KYC,
        utilisateur=utilisateur,
        reponse_json=True,
        images=[(image_carte, 'image/jpeg'), (image_selfie, 'image/jpeg')],
    )

    try:
        resultat = json.loads(texte_reponse)
    except (json.JSONDecodeError, TypeError) as exc:
        raise ErreurAppelIA(f"Réponse Gemini non-JSON pour le module KYC : {exc}") from exc

    for champ in ('document_lisible', 'recommandation', 'justification'):
        if champ not in resultat:
            raise ErreurAppelIA(f"Champ manquant '{champ}' dans la réponse Gemini (KYC).")

    from accounts.models import Prestataire

    mapping_statut = {
        'approuver': Prestataire.StatutKYC.VERIFIE,
        'rejeter': Prestataire.StatutKYC.REJETE,
        'verification_manuelle': Prestataire.StatutKYC.EN_ATTENTE,
    }
    prestataire.statut_kyc = mapping_statut.get(
        resultat['recommandation'], Prestataire.StatutKYC.EN_ATTENTE
    )
    prestataire.kyc_commentaire = resultat['justification']
    prestataire.save(update_fields=['statut_kyc', 'kyc_commentaire'])

    return resultat