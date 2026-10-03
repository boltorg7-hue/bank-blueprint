/**
 * Homepage heritage, places and local news.
 *
 * Only verifiable facts are published: the bank's own registered identity
 * (founding date, head office, supervisor, SWIFT) and dated public releases
 * from the Central Bank of Trinidad and Tobago, linked to their source.
 * Photographs are freely licensed Wikimedia Commons images, credited below;
 * none depicts bank staff or customers.
 */
export type HomePhoto = {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  license: string;
  sourceUrl: string;
};

export const HERO_PHOTO: HomePhoto = {
  src: "/images/home/woodbrook-1280w.jpg",
  alt: "Immeuble One Woodbrook Place dans le quartier de Woodbrook, à Port of Spain",
  caption: "Woodbrook, Port of Spain — le quartier de notre siège",
  credit: "Silverkid3",
  license: "CC BY-SA 3.0",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:One_Woodbrook_Place,_Port_of_Spain_2012.jpg",
};

export const PLACE_PHOTOS: HomePhoto[] = [
  {
    src: "/images/home/savannah-960w.jpg",
    alt: "Pelouse du Queen's Park Savannah à Port of Spain",
    caption: "Queen's Park Savannah, Port of Spain",
    credit: "Grueslayer",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:TnT_PoS_Queen%27s_Park_Savannah.jpg",
  },
  {
    src: "/images/home/maracas-960w.jpg",
    alt: "Baie de Maracas sur la côte nord de Trinidad",
    caption: "Maracas Bay, côte nord de Trinidad",
    credit: "Kalamazadkhan",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Maracas_Bay_-_Trinidad,_West_Indies.jpg",
  },
];

export const HERITAGE_FACTS: { label: string; value: string }[] = [
  { label: "Fondée le", value: "23 juillet 1972" },
  { label: "Siège", value: "Woodbrook, Trinidad-et-Tobago" },
  { label: "Supervision", value: "Central Bank of Trinidad and Tobago" },
  { label: "SWIFT / BIC", value: "RBTTTTPXXX" },
];

export const LOCAL_NEWS: { date: string; title: string; summary: string; url: string }[] = [
  {
    date: "2026-09-18",
    title: "Vers un système de paiement régional CARICOM",
    summary:
      "Les banques centrales de la région avancent sur le CAPSS, une plateforme de paiements instantanés en monnaies locales entre États membres.",
    url: "https://www.central-bank.org.tt/regional-central-banks-further-discussions-on-caricom-payment-and-settlement-system-with-papss-engagement/",
  },
  {
    date: "2026-09-14",
    title: "Actifs virtuels : opportunités et risques",
    summary:
      "Table ronde de la Banque centrale sur les prestataires de services d'actifs virtuels, lors du Research Review Seminar 2026.",
    url: "https://www.central-bank.org.tt/wp-content/uploads/2026/09/latest-news-central-bank-explores-virtual-asset-providers-september-2026.pdf",
  },
  {
    date: "2026-09-10",
    title: "« Operating in a Fractured World »",
    summary:
      "Ouverture du séminaire annuel de recherche de la Banque centrale sur la résilience économique, l'innovation et la durabilité.",
    url: "https://www.central-bank.org.tt/wp-content/uploads/2026/09/latest-news-operating-in-a-fractured-world-september-2026.pdf",
  },
  {
    date: "2026-08-03",
    title: "Nouveau prestataire de services de paiement agréé",
    summary:
      "La Banque centrale élargit l'enregistrement de GraceKennedy (Trinidad & Tobago) Limited au statut de prestataire de services de paiement.",
    url: "https://www.central-bank.org.tt/central-bank-registers-gracekennedy-trinidad-tobago-limited-as-a-payment-service-provider-in-trinidad-and-tobago/",
  },
];
