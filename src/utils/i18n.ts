export const languages = [
	{ code: "de", name: "Deutsch" },
	{ code: "en", name: "English" },
	{ code: "fr", name: "Français" },
] as const;
export type Locale = (typeof languages)[number]["code"];
export function siteLocale(locale?: string): Locale {
	return locale === "en" || locale === "fr" ? locale : "de";
}
export function localizedHref(href: string, locale?: string): string {
	if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/_emdash")) return href;
	// EmDash includes the locale in non-default article entry IDs.
	const path = href
		.replace(/^\/(?:de|en|fr)(?=\/|[?#]|$)/, "")
		.replace(/^\/posts\/(?:de|en|fr)\//, "/posts/");
	return `${siteLocale(locale) === "de" ? "" : `/${siteLocale(locale)}`}${path.startsWith("/") ? path : `/${path}`}`;
}
interface Translation {
	locale: string;
	slug: string | null;
	status: string;
}
export function translationHref(
	pathname: string,
	locale: Locale,
	content?: { collection: string; slug?: string | null },
	translations: Translation[] = [],
): string {
	const path = localizedHref(pathname, "de");
	const translation = translations.find(
		(item) => item.locale === locale && item.status === "published" && item.slug,
	);
	if (!content || path === "/" || path === "/posts" || path === "/posts/")
		return localizedHref(path, locale);
	const german = translations.find(
		(item) => item.locale === "de" && item.status === "published" && item.slug,
	);
	if (!translation && !german && translations.length)
		return localizedHref(content.collection === "posts" ? "/posts" : "/", locale);
	const slug = translation?.slug ?? german?.slug ?? content.slug;
	return localizedHref(
		slug ? `${content.collection === "posts" ? "/posts" : ""}/${slug}` : path,
		locale,
	);
}
const ui = {
	de: {
		navigation: "Hauptnavigation",
		language: "Sprache",
		home: "Start",
		about: "Über mich",
		hello: "Sag Hallo",
		fallback:
			"Diese Übersetzung ist noch nicht veröffentlicht. Der Inhalt wird auf Deutsch angezeigt.",
		greeting: "Hi, ich bin",
		flip: "Karte umdrehen",
		front: "Vorderseite anzeigen",
		back: "Zurück",
		discovered: "entdeckt",
		shuffle: "Neu mischen",
		profile: "Profil",
		clickCard: "Klick die Karte",
		all: "Alle",
		allPosts: "Alle Beiträge",
		noPosts: "Noch keine Beiträge veröffentlicht.",
		categoryFilter: "Beiträge nach Kategorie filtern",
		toolFilter: "Werkzeuge nach Kategorie filtern",
		items: "Items",
		current: "Aktuell",
		education: "Ausbildung",
		job: "Job",
		running: "Läuft",
		inProgress: "In Arbeit",
		paused: "Pausiert",
		completed: "Abgeschlossen",
		post: "Beitrag",
		activeQuests: "Active Quests",
		contributions: "Beiträge",
		yearContributions: "Beiträge im letzten Jahr",
		longestStreak: "Tage längste Serie",
		graph: "GitHub-Beiträge der letzten zwölf Monate",
		githubUnavailable: "GitHub-Aktivität ist derzeit nicht verfügbar.",
		highlighted: "Hervorgehoben",
		newest: "Neu",
		read: "Lesen",
		entry: "Eintrag",
		entries: "Einträge",
		onPage: "auf dieser Seite",
		clearFilter: "Filter entfernen",
		loadError: "Die Beiträge konnten nicht geladen werden. Bitte versuche es später erneut.",
		empty: "Noch keine Beiträge",
		emptyFilter: "Für diesen Filter gibt es noch keine veröffentlichten Beiträge.",
		emptyAll: "Hier erscheinen bald die ersten Beiträge.",
		showAll: "Alle Beiträge anzeigen",
		morePosts: "Weitere Beiträge",
		firstPage: "Erste Seite",
		contents: "Inhalt",
		articleContents: "Artikelinhalt",
		questions: "Fragen dazu?",
		writeLukas: "Schreib Lukas",
		related: "Weiterlesen",
		notFound: "Seite nicht gefunden",
		missingPage: "Die gesuchte Seite existiert nicht.",
	},
	en: {
		navigation: "Main navigation",
		language: "Language",
		home: "Home",
		about: "About me",
		hello: "Say hello",
		fallback: "This translation has not been published yet. The content is shown in German.",
		greeting: "Hi, I'm",
		flip: "Flip card",
		front: "Show front",
		back: "Back",
		discovered: "discovered",
		shuffle: "Shuffle",
		profile: "Profile",
		clickCard: "Click the card",
		all: "All",
		allPosts: "All posts",
		noPosts: "No posts published yet.",
		categoryFilter: "Filter posts by category",
		toolFilter: "Filter tools by category",
		items: "Items",
		current: "Current",
		education: "Education",
		job: "Job",
		running: "Running",
		inProgress: "In progress",
		paused: "Paused",
		completed: "Completed",
		post: "Post",
		activeQuests: "Active Quests",
		contributions: "contributions",
		yearContributions: "Contributions in the last year",
		longestStreak: "Days in longest streak",
		graph: "GitHub contributions over the last twelve months",
		githubUnavailable: "GitHub activity is currently unavailable.",
		highlighted: "Highlighted",
		newest: "New",
		read: "Read",
		entry: "entry",
		entries: "entries",
		onPage: "on this page",
		clearFilter: "Remove filter",
		loadError: "Posts could not be loaded. Please try again later.",
		empty: "No posts yet",
		emptyFilter: "There are no published posts for this filter yet.",
		emptyAll: "The first posts will appear here soon.",
		showAll: "Show all posts",
		morePosts: "More posts",
		firstPage: "First page",
		contents: "Contents",
		articleContents: "Article contents",
		questions: "Any questions?",
		writeLukas: "Write to Lukas",
		related: "Read more",
		notFound: "Page not found",
		missingPage: "The page you're looking for doesn't exist.",
	},
	fr: {
		navigation: "Navigation principale",
		language: "Langue",
		home: "Accueil",
		about: "À propos",
		hello: "Dites bonjour",
		fallback: "Cette traduction n’est pas encore publiée. Le contenu est affiché en allemand.",
		greeting: "Salut, moi c’est",
		flip: "Retourner la carte",
		front: "Afficher le recto",
		back: "Retour",
		discovered: "découvertes",
		shuffle: "Mélanger",
		profile: "Profil",
		clickCard: "Cliquez sur la carte",
		all: "Tous",
		allPosts: "Tous les articles",
		noPosts: "Aucun article publié pour le moment.",
		categoryFilter: "Filtrer les articles par catégorie",
		toolFilter: "Filtrer les outils par catégorie",
		items: "Éléments",
		current: "Actuel",
		education: "Formation",
		job: "Emploi",
		running: "En cours",
		inProgress: "En développement",
		paused: "En pause",
		completed: "Terminé",
		post: "Article",
		activeQuests: "Quêtes actives",
		contributions: "contributions",
		yearContributions: "Contributions durant l’année écoulée",
		longestStreak: "Jours de la plus longue série",
		graph: "Contributions GitHub des douze derniers mois",
		githubUnavailable: "L’activité GitHub est actuellement indisponible.",
		highlighted: "À la une",
		newest: "Nouveau",
		read: "Lire",
		entry: "article",
		entries: "articles",
		onPage: "sur cette page",
		clearFilter: "Supprimer le filtre",
		loadError: "Impossible de charger les articles. Veuillez réessayer plus tard.",
		empty: "Aucun article pour le moment",
		emptyFilter: "Aucun article publié ne correspond à ce filtre.",
		emptyAll: "Les premiers articles apparaîtront bientôt ici.",
		showAll: "Voir tous les articles",
		morePosts: "Plus d’articles",
		firstPage: "Première page",
		contents: "Sommaire",
		articleContents: "Sommaire de l’article",
		questions: "Des questions ?",
		writeLukas: "Écrivez à Lukas",
		related: "À lire aussi",
		notFound: "Page introuvable",
		missingPage: "La page que vous recherchez n’existe pas.",
	},
};
export function siteUi(locale?: string) {
	return ui[siteLocale(locale)];
}
export function projectStatusLabel(status: string | undefined, locale?: string) {
	const copy = siteUi(locale);
	return status === "In Arbeit"
		? copy.inProgress
		: status === "Abgeschlossen"
			? copy.completed
			: status;
}
