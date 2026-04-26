export type Locale = "fr" | "en";

export const translations = {
  fr: {
    appTitle: "LyricsFind",
    appSubtitle: "Recherche de paroles pour ProPresenter",
    artistPlaceholder: "Artiste",
    titlePlaceholder: "Titre de la chanson",
    searchButton: "Rechercher",
    searching: "Recherche en cours…",
    copyButton: "Copier les paroles",
    copied: "Copié !",
    notFound:
      "Paroles introuvables. Vérifie le nom de l'artiste et le titre exact.",
    historyTitle: "Recherches récentes",
    historyEmpty: "Aucune recherche récente",
    clearHistory: "Effacer",
    languageToggle: "EN",
    errorGeneric: "Une erreur est survenue. Réessaie.",
  },
  en: {
    appTitle: "LyricsFind",
    appSubtitle: "Lyrics search tool for ProPresenter",
    artistPlaceholder: "Artist",
    titlePlaceholder: "Song title",
    searchButton: "Search",
    searching: "Searching…",
    copyButton: "Copy lyrics",
    copied: "Copied!",
    notFound:
      "Lyrics not found. Check the artist name and exact song title.",
    historyTitle: "Recent searches",
    historyEmpty: "No recent searches",
    clearHistory: "Clear",
    languageToggle: "FR",
    errorGeneric: "An error occurred. Please try again.",
  },
} as const;

export type TranslationKey = keyof typeof translations.fr;
