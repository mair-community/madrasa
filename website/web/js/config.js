/**
 * Project-wide constants.
 *
 * BASE is derived from this module's own URL so the site works identically at a
 * domain root (`/`) and at a GitHub Pages project path (`/madrasa/`), with no
 * build-time configuration.
 */
export const BASE = new URL(import.meta.url).protocol === 'file:'
  ? '/' : new URL('../../', import.meta.url).pathname;

export const REPO = 'https://github.com/mair-community/madrasa';
export const LINKS = {
  repo: REPO,
  schema: `${REPO}/blob/main/docs/schema.md`,
  contributing: `${REPO}/blob/main/CONTRIBUTING.md`,
  license: `${REPO}/blob/main/LICENSE`,
  issues: `${REPO}/issues`,
  catalogDir: `${REPO}/tree/main/catalog`,
  newProgram: `${REPO}/issues/new?template=submit-educational-program.yml`,
  newStructure: `${REPO}/issues/new?template=submit-research-structure.yml`,
  discord: 'https://discord.gg/ZtNuKJ7V2H',
  mair: 'https://mair.ma/',
};

/** Source files. These are the repository's real catalog, not a copy. */
export const SOURCES = {
  programs: `${BASE}catalog/education_programs.json`,
  structures: `${BASE}catalog/research_structures.json`,
};

/**
 * Presentation-layer canonicalisation.
 *
 * The catalog is hand-edited, so a handful of entities are spelled two ways.
 * We reconcile them for display and faceting only; `catalog/*.json` stays the
 * single source of truth and is never rewritten by the site.
 */
export const INSTITUTION_ALIASES = {
  'mohammed v university in rabat': 'Mohammed V University of Rabat',
  'national institute of posts and telecommunications (inpt)': 'National Institute of Posts and Telecommunications',
};

export const CITY_ALIASES = {
  'ben guerir': 'Benguerir',
};

export const DOMAIN_ALIASES = {
  ai: 'Artificial Intelligence',
  'machine learning': 'Machine Learning',
  nlp: 'Natural Language Processing',
  iot: 'Internet of Things',
  llm: 'Large Language Models',
  hpc: 'High-Performance Computing',
  'hpc algorithms': 'High-Performance Computing',
};

/** Short forms used for the monogram tiles. Keyed by canonical institution name. */
export const INSTITUTION_SHORT = {
  'Mohammed VI Polytechnic University': 'UM6P',
  'Hassan II University of Casablanca': 'UH2C',
  'Cadi Ayyad University': 'UCA',
  'Ibn Tofail University': 'UIT',
  'Mohammed V University of Rabat': 'UM5',
  'Sidi Mohamed Ben Abdellah University': 'USMBA',
  'Abdelmalek Essaadi University': 'UAE',
  'Al Akhawayn University': 'AUI',
  'International University of Rabat': 'UIR',
  'Euromed University of Fes': 'UEMF',
  'National Institute of Statistics and Applied Economics': 'INSEA',
  'Mohammed First University': 'UMP',
  'Sultan Moulay Slimane University': 'USMS',
  'Hassan First University of Settat': 'UH1',
  'National Higher School of Mines of Rabat': 'ENSMR',
  'Chouaib Doukkali University': 'UCD',
  'Higher School of Engineering in Applied Sciences': 'ESISA',
  'National Institute of Posts and Telecommunications': 'INPT',
};

/**
 * Official institution logos, harvested from each institution's own site by
 * `scripts/fetch_logos.py`. Provenance for every file is in assets/logos/SOURCES.json.
 * Missing entries fall back to the lettermark, so this map can stay partial.
 */
export const INSTITUTION_LOGO = {
  "Abdelmalek Essaadi University": { file: "uae.png", w: 240, h: 70 },
  "Al Akhawayn University": { file: "aui.png", w: 135, h: 88 },
  "Cadi Ayyad University": { file: "uca.png", w: 69, h: 88 },
  "Chouaib Doukkali University": { file: "ucd.png", w: 152, h: 88 },
  "Euromed University of Fes": { file: "uemf.png", w: 185, h: 88 },
  "Hassan First University of Settat": { file: "uh1.png", w: 240, h: 72 },
  "Hassan II University of Casablanca": { file: "uh2c.png", w: 105, h: 88 },
  "Higher School of Engineering in Applied Sciences": { file: "esisa.png", w: 162, h: 88 },
  "Ibn Tofail University": { file: "uit.png", w: 85, h: 88 },
  "International University of Rabat": { file: "uir.png", w: 84, h: 88 },
  "Mohammed First University": { file: "ump.png", w: 82, h: 88 },
  "Mohammed V University of Rabat": { file: "um5.png", w: 104, h: 88 },
  "Mohammed VI Polytechnic University": { file: "um6p.png", w: 240, h: 36 },
  "National Higher School of Mines of Rabat": { file: "ensmr.png", w: 240, h: 56 },
  "National Institute of Posts and Telecommunications": { file: "inpt.png", w: 209, h: 88 },
  "National Institute of Statistics and Applied Economics": { file: "insea.png", w: 78, h: 88 },
  "Sidi Mohamed Ben Abdellah University": { file: "usmba.png", w: 240, h: 77 },
  "Sultan Moulay Slimane University": { file: "usms.png", w: 240, h: 74 },
};

/** Human labels for the coded enum values in the schema. */
export const LABELS = {
  mode: {
    in_person: 'On campus',
    online: 'Online',
    hybrid: 'Hybrid',
    executive: 'Executive',
    research: 'Research',
    alternance: 'Work-study',
    unknown: 'Not specified',
  },
  tuition: {
    public: 'Public tuition',
    private: 'Private tuition',
    funded: 'Funded',
    fellowship: 'Fellowship',
    paid: 'Paid',
    unknown: 'Not specified',
  },
  status: {
    active: 'Active',
    likely_active: 'Likely active',
    unknown: 'Status unknown',
    inactive: 'Not active',
    nonactive: 'Not active',
  },
};

/** Region ordering follows Morocco's official north-to-south sequence. */
export const REGION_ORDER = [
  'Tanger-Tetouan-Al Hoceima',
  'Oriental',
  'Fes-Meknes',
  'Rabat-Sale-Kenitra',
  'Beni Mellal-Khenifra',
  'Casablanca-Settat',
  'Marrakesh-Safi',
  'Draa-Tafilalet',
  'Souss-Massa',
  'Guelmim-Oued Noun',
  'Laayoune-Sakia El Hamra',
  'Dakhla-Oued Ed-Dahab',
  'Multiple regions',
];

/**
 * Domain families used by the Domains page to give 100+ free-text tags a
 * navigable shape. Order matters: the first family that matches wins.
 */
export const DOMAIN_FAMILIES = [
  {
    id: 'core-ai',
    name: 'Core AI & learning',
    blurb: 'The methods themselves: learning algorithms, models and reasoning.',
    match: ['Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Large Language Models',
      'Generative AI', 'Agentic AI', 'Applied AI', 'Distributed AI', 'Industrial AI', 'Trustworthy AI',
      'AI for Science', 'Multi-Agent Systems', 'Genetic Algorithms', 'Pattern Recognition',
      'Virtual Assistants', 'Intelligent Systems'],
  },
  {
    id: 'language-vision',
    name: 'Language & perception',
    blurb: 'Getting machines to read, hear and see, including Moroccan Darija.',
    match: ['Natural Language Processing', 'Darija', 'Low-Resource Languages', 'Image Processing',
      'Signal Processing', 'Signals', 'Computer Vision', 'Information Retrieval', 'Information Processing'],
  },
  {
    id: 'data',
    name: 'Data & decision science',
    blurb: 'Turning data into decisions: engineering, analytics, statistics, optimisation.',
    match: ['Data Science', 'Data Engineering', 'Data Mining', 'Data Analysis', 'Data Management',
      'Big Data', 'Statistics', 'Mathematics', 'Mathematical Modeling', 'Modeling', 'Digital Modeling',
      'Numerical Analysis', 'Numerical Methods', 'Optimization', 'Operations Research',
      'Decision Systems', 'Decision Support', 'Competitive Intelligence'],
  },
  {
    id: 'systems',
    name: 'Systems & computing',
    blurb: 'The machinery underneath: computing platforms, networks and security.',
    match: ['Computer Science', 'Applied Computer Science', 'Cybersecurity', 'Security', 'Cryptography',
      'Cryptology', 'Digital Identity', 'Cloud', 'Distributed Systems', 'High-Performance Computing',
      'Scientific Computing', 'Computational Engineering', 'Blockchain', 'Software Engineering',
      'Information Systems', 'Telecommunications', 'Mobile Systems', 'Internet of Things',
      'Embedded Systems', 'Electronics', 'Complex Systems', 'Systems', 'Emerging Systems',
      'Advanced Systems', 'Simulation', 'Engineering Simulation'],
  },
  {
    id: 'industry',
    name: 'Industry & the physical world',
    blurb: 'AI meeting hardware, factories, energy, mobility and cities.',
    match: ['Robotics', 'Automation', 'Automotive', 'Aerospace', 'Drones', 'Manufacturing',
      'Industry 4.0', 'Industrial Engineering', 'Industrial Systems', 'Cyber-Physical Systems',
      'Mechanical Engineering', 'Electrical Engineering', 'Mechanics', 'Systems Engineering',
      'Engineering', 'Energy', 'Renewable Energy', 'Hydrogen', 'Smart Systems', 'Smart Cities',
      'Smart Technologies', 'Logistics', 'Digital Twin', 'Sustainability', 'Sustainable Technologies',
      'Physics', 'Chemistry', 'Materials Science'],
  },
  {
    id: 'life-society',
    name: 'Life sciences & society',
    blurb: 'Health, biology, education and the human side of the field.',
    match: ['Bioinformatics', 'Computational Biology', 'Computational Genomics', 'Biotechnology',
      'Pharmaceutical Bioengineering', 'Biomedical Systems', 'Health', 'Digital Health', 'Education',
      'Digital Learning', 'Humanities and Social Sciences', 'Entertainment', 'Innovation',
      'Digital Innovation', 'Digital Transformation', 'Interdisciplinary Research',
      'Emerging Technologies'],
  },
];
