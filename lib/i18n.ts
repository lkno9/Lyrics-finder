export type Locale = "fr" | "en";

export const translations = {
  fr: {
    appTitle: "LyricsFind",
    appSubtitle: "Recherche de paroles pour ProPresenter",
    searchPlaceholder: "Rechercher par artiste, titre, ou quelques mots…",
    searchButton: "Rechercher",
    searching: "Recherche…",
    copyButton: "Copier les paroles",
    copied: "Copié !",
    notFound:
      "Paroles introuvables. Essaie avec d'autres mots-clés.",
    suggestionsTitle: "Résultats trouvés",
    noSuggestions: "Aucun résultat. Essaie avec d'autres termes.",
    historyTitle: "Récents",
    historyEmpty: "Aucune recherche récente",
    clearHistory: "Effacer",
    languageToggle: "EN",
    errorGeneric: "Une erreur est survenue. Réessaie.",
  },
  en: {
    appTitle: "LyricsFind",
    appSubtitle: "Lyrics search tool for ProPresenter",
    searchPlaceholder: "Search by artist, title, or a few words…",
    searchButton: "Search",
    searching: "Searching…",
    copyButton: "Copy lyrics",
    copied: "Copied!",
    notFound:
      "Lyrics not found. Try different keywords.",
    suggestionsTitle: "Results found",
    noSuggestions: "No results. Try different terms.",
    historyTitle: "Recent",
    historyEmpty: "No recent searches",
    clearHistory: "Clear",
    languageToggle: "FR",
    errorGeneric: "An error occurred. Please try again.",
  },
} as const;

export type TranslationKey = keyof typeof translations.fr;
