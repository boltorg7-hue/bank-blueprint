/** Predefined onboarding choices so customers pick instead of typing. Values stay stable (English); labels are localised. */
export type Choice = { value: string; fr: string; en: string };

export const COUNTRIES: Choice[] = [
  { value: "Trinidad and Tobago", fr: "Trinité-et-Tobago", en: "Trinidad and Tobago" },
  { value: "Barbados", fr: "Barbade", en: "Barbados" },
  { value: "Jamaica", fr: "Jamaïque", en: "Jamaica" },
  { value: "Grenada", fr: "Grenade", en: "Grenada" },
  { value: "Saint Lucia", fr: "Sainte-Lucie", en: "Saint Lucia" },
  { value: "Saint Vincent and the Grenadines", fr: "Saint-Vincent-et-les-Grenadines", en: "Saint Vincent and the Grenadines" },
  { value: "Guyana", fr: "Guyana", en: "Guyana" },
  { value: "Suriname", fr: "Suriname", en: "Suriname" },
  { value: "Bahamas", fr: "Bahamas", en: "Bahamas" },
  { value: "Antigua and Barbuda", fr: "Antigua-et-Barbuda", en: "Antigua and Barbuda" },
  { value: "Dominica", fr: "Dominique", en: "Dominica" },
  { value: "Venezuela", fr: "Venezuela", en: "Venezuela" },
  { value: "United States", fr: "États-Unis", en: "United States" },
  { value: "Canada", fr: "Canada", en: "Canada" },
  { value: "United Kingdom", fr: "Royaume-Uni", en: "United Kingdom" },
  { value: "France", fr: "France", en: "France" },
  { value: "Belgium", fr: "Belgique", en: "Belgium" },
  { value: "Switzerland", fr: "Suisse", en: "Switzerland" },
  { value: "Germany", fr: "Allemagne", en: "Germany" },
  { value: "Spain", fr: "Espagne", en: "Spain" },
  { value: "Italy", fr: "Italie", en: "Italy" },
  { value: "Netherlands", fr: "Pays-Bas", en: "Netherlands" },
  { value: "Portugal", fr: "Portugal", en: "Portugal" },
  { value: "Brazil", fr: "Brésil", en: "Brazil" },
  { value: "Mexico", fr: "Mexique", en: "Mexico" },
  { value: "Colombia", fr: "Colombie", en: "Colombia" },
  { value: "Cameroon", fr: "Cameroun", en: "Cameroon" },
  { value: "Côte d'Ivoire", fr: "Côte d'Ivoire", en: "Côte d'Ivoire" },
  { value: "Senegal", fr: "Sénégal", en: "Senegal" },
  { value: "Nigeria", fr: "Nigeria", en: "Nigeria" },
  { value: "Ghana", fr: "Ghana", en: "Ghana" },
  { value: "South Africa", fr: "Afrique du Sud", en: "South Africa" },
  { value: "Morocco", fr: "Maroc", en: "Morocco" },
  { value: "India", fr: "Inde", en: "India" },
  { value: "China", fr: "Chine", en: "China" },
  { value: "Japan", fr: "Japon", en: "Japan" },
  { value: "United Arab Emirates", fr: "Émirats arabes unis", en: "United Arab Emirates" },
  { value: "Australia", fr: "Australie", en: "Australia" },
];

export const OCCUPATIONS: Choice[] = [
  { value: "Employee", fr: "Salarié(e)", en: "Employee" },
  { value: "Civil servant", fr: "Fonctionnaire", en: "Civil servant" },
  { value: "Self-employed", fr: "Indépendant(e) / entrepreneur", en: "Self-employed / entrepreneur" },
  { value: "Company director", fr: "Dirigeant(e) d'entreprise", en: "Company director" },
  { value: "Liberal profession", fr: "Profession libérale", en: "Liberal profession" },
  { value: "Health professional", fr: "Professionnel(le) de santé", en: "Health professional" },
  { value: "Teacher", fr: "Enseignant(e)", en: "Teacher" },
  { value: "Engineer / IT", fr: "Ingénieur(e) / informatique", en: "Engineer / IT" },
  { value: "Energy sector", fr: "Secteur énergie", en: "Energy sector" },
  { value: "Tourism / hospitality", fr: "Tourisme / hôtellerie", en: "Tourism / hospitality" },
  { value: "Student", fr: "Étudiant(e)", en: "Student" },
  { value: "Retired", fr: "Retraité(e)", en: "Retired" },
  { value: "Unemployed", fr: "Sans emploi", en: "Unemployed" },
];

/** Trinidad and Tobago municipal corporations + Tobago. */
export const TT_REGIONS = [
  "Port of Spain", "San Fernando", "Arima", "Chaguanas", "Point Fortin",
  "Diego Martin", "San Juan–Laventille", "Tunapuna–Piarco", "Sangre Grande",
  "Couva–Tabaquite–Talparo", "Mayaro–Rio Claro", "Princes Town", "Penal–Debe",
  "Siparia", "Tobago",
];

export const TT_CITIES = [
  "Port of Spain", "Woodbrook", "St. James", "Maraval", "Diego Martin", "San Fernando",
  "Chaguanas", "Arima", "Couva", "Point Fortin", "Tunapuna", "St. Augustine", "Sangre Grande",
  "Princes Town", "Siparia", "Scarborough", "Crown Point", "Plymouth", "Roxborough",
];

export function choiceLabel(list: Choice[], value: string | null | undefined, en: boolean): string {
  const item = list.find((c) => c.value === value);
  return item ? (en ? item.en : item.fr) : (value ?? "");
}
