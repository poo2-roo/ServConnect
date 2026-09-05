import { StyleSheet } from 'react-native';
import { couleurs } from './colors';

export const rayons = {
  petit: 8,
  moyen: 12,
  grand: 16,
  rond: 999,
};

export const espacements = {
  xs: 4,
  sm: 8,
  md: 20,
  lg: 30,
  xl: 50,
};

export const stylesPartages = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: couleurs.fond,
  },
  carte: {
    backgroundColor: couleurs.blanc,
    borderRadius: rayons.grand,
    padding: espacements.md,
    marginBottom: espacements.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2, // équivalent Android de l'ombre iOS
  },
  boutonPrincipal: {
    backgroundColor: couleurs.bleuBase,
    borderRadius: rayons.moyen,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonPrincipalTexte: {
    color: couleurs.blanc,
    fontSize: 16,
    fontWeight: '600',
  },
  boutonContour: {
    borderWidth: 1.5,
    borderColor: couleurs.bleuBase,
    borderRadius: rayons.moyen,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonContourTexte: {
    color: couleurs.bleuBase,
    fontSize: 14,
    fontWeight: '600',
  },
  pilleCategorie: {
    borderRadius: rayons.rond,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: couleurs.fond,
    borderWidth: 1,
    borderColor: couleurs.bordure,
  },
  pilleCategorieActive: {
    backgroundColor: couleurs.bleuBase,
    borderColor: couleurs.bleuBase,
  },
  badgeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 17, 47, 0.75)',
    borderRadius: rayons.rond,
    paddingVertical: 4,
    paddingHorizontal: 8,
    position: 'absolute',
    top: espacements.sm,
    right: espacements.sm,
  },
  badgeNoteTexte: {
    color: couleurs.blanc,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  boutonIA: {
    backgroundColor: couleurs.secondaire,
    borderRadius: rayons.moyen,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonIATexte: {
    color: couleurs.blanc,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});