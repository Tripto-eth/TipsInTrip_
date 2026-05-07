export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  q: string;
  opts: [string, string, string, string];
  a: 0 | 1 | 2 | 3;
  diff: Difficulty;
  emoji?: string;
}

export const QUESTIONS: QuizQuestion[] = [
  // ── EASY ───────────────────────────────────────────────────────
  { q: 'Qual è la capitale della Spagna?', opts: ['Roma', 'Lisbona', 'Madrid', 'Barcellona'], a: 2, diff: 'easy', emoji: '🇪🇸' },
  { q: "Qual è l'oceano più grande del mondo?", opts: ['Atlantico', 'Indiano', 'Artico', 'Pacifico'], a: 3, diff: 'easy', emoji: '🌊' },
  { q: 'In quale paese si trova la Torre Eiffel?', opts: ['Italia', 'Spagna', 'Germania', 'Francia'], a: 3, diff: 'easy', emoji: '🗼' },
  { q: 'Qual è la capitale del Giappone?', opts: ['Shanghai', 'Seoul', 'Tokyo', 'Beijing'], a: 2, diff: 'easy', emoji: '🇯🇵' },
  { q: 'In quale continente si trova il Brasile?', opts: ['Africa', 'Asia', 'Nord America', 'Sud America'], a: 3, diff: 'easy', emoji: '🇧🇷' },
  { q: 'Qual è la moneta del Giappone?', opts: ['Won', 'Yuan', 'Yen', 'Baht'], a: 2, diff: 'easy', emoji: '💴' },
  { q: 'In quale città si trova il Colosseo?', opts: ['Atene', 'Istanbul', 'Barcellona', 'Roma'], a: 3, diff: 'easy', emoji: '🏟️' },
  { q: "Quale paese ha la bandiera con la foglia d'acero?", opts: ['Australia', 'Nuova Zelanda', 'Canada', 'USA'], a: 2, diff: 'easy', emoji: '🍁' },
  { q: 'Qual è la capitale della Germania?', opts: ['Monaco', 'Amburgo', 'Francoforte', 'Berlino'], a: 3, diff: 'easy', emoji: '🇩🇪' },
  { q: 'In quale paese si trova la Sagrada Família?', opts: ['Portogallo', 'Spagna', 'Italia', 'Francia'], a: 1, diff: 'easy', emoji: '⛪' },
  { q: "Qual è la vera capitale dell'Australia?", opts: ['Sydney', 'Melbourne', 'Brisbane', 'Canberra'], a: 3, diff: 'easy', emoji: '🇦🇺' },
  { q: 'Quante stelle ci sono sulla bandiera degli USA?', opts: ['48', '49', '50', '52'], a: 2, diff: 'easy', emoji: '🇺🇸' },
  { q: 'In quale paese si trova il Partenone?', opts: ['Italia', 'Turchia', 'Grecia', 'Egitto'], a: 2, diff: 'easy', emoji: '🏛️' },
  { q: "Qual è la capitale dell'Egitto?", opts: ['Alessandria', 'Luxor', 'Il Cairo', 'Assuan'], a: 2, diff: 'easy', emoji: '🇪🇬' },
  { q: 'Quale paese è il più grande del mondo per superficie?', opts: ['Cina', 'USA', 'Canada', 'Russia'], a: 3, diff: 'easy', emoji: '🌍' },

  // ── MEDIUM ──────────────────────────────────────────────────────
  { q: 'Qual è la capitale del Canada?', opts: ['Toronto', 'Vancouver', 'Ottawa', 'Montréal'], a: 2, diff: 'medium', emoji: '🇨🇦' },
  { q: 'In quale paese si trova Machu Picchu?', opts: ['Bolivia', 'Ecuador', 'Colombia', 'Perù'], a: 3, diff: 'medium', emoji: '🏔️' },
  { q: 'Qual è la capitale del Portogallo?', opts: ['Porto', 'Faro', 'Coimbra', 'Lisbona'], a: 3, diff: 'medium', emoji: '🇵🇹' },
  { q: "In quale paese si trova l'isola di Zanzibar?", opts: ['Kenya', 'Mozambico', 'Tanzania', 'Madagascar'], a: 2, diff: 'medium', emoji: '🏝️' },
  { q: "Quale aeroporto ha il codice IATA 'JFK'?", opts: ['Los Angeles', 'Chicago', 'Miami', 'New York'], a: 3, diff: 'medium', emoji: '✈️' },
  { q: 'Quale paese ha regalato la Statua della Libertà agli USA?', opts: ['Gran Bretagna', 'Germania', 'Spagna', 'Francia'], a: 3, diff: 'medium', emoji: '🗽' },
  { q: "Qual è la capitale dell'Argentina?", opts: ['Santiago', 'Lima', 'Montevideo', 'Buenos Aires'], a: 3, diff: 'medium', emoji: '🇦🇷' },
  { q: 'In quale paese si trova Angkor Wat?', opts: ['Thailandia', 'Cambogia', 'Vietnam', 'Laos'], a: 1, diff: 'medium', emoji: '🏯' },
  { q: "Quale compagnia aerea usa il codice IATA 'EK'?", opts: ['Etihad', 'Emirates', 'Qatar Airways', 'Turkish Airlines'], a: 1, diff: 'medium', emoji: '✈️' },
  { q: 'In quale paese si trova Petra?', opts: ['Arabia Saudita', 'Egitto', 'Israele', 'Giordania'], a: 3, diff: 'medium', emoji: '🏺' },
  { q: "Quale stretto separa l'Europa dall'Africa?", opts: ['Stretto di Sicilia', 'Stretto di Messina', 'Stretto di Gibilterra', 'Stretto di Ormuz'], a: 2, diff: 'medium', emoji: '🌊' },
  { q: 'Qual è la valuta della Thailandia?', opts: ['Ringgit', 'Dong', 'Kip', 'Baht'], a: 3, diff: 'medium', emoji: '🇹🇭' },
  { q: "Qual è il confine terrestre più lungo del mondo?", opts: ['Russia-Cina', 'USA-Canada', 'Cina-Mongolia', 'Russia-Kazakhstan'], a: 1, diff: 'medium', emoji: '🗺️' },
  { q: 'Qual è la capitale dei Paesi Bassi?', opts: ['Rotterdam', 'Utrecht', "L'Aia", 'Amsterdam'], a: 3, diff: 'medium', emoji: '🇳🇱' },
  { q: 'In quale paese si trova la Grande Barriera Corallina?', opts: ['Filippine', 'Indonesia', 'Australia', 'Brasile'], a: 2, diff: 'medium', emoji: '🪸' },

  // ── HARD ────────────────────────────────────────────────────────
  { q: 'Qual è la capitale del Bhutan?', opts: ['Kathmandu', 'Thimphu', 'Paro', 'Punakha'], a: 1, diff: 'hard', emoji: '🇧🇹' },
  { q: 'Quale paese africano non è mai stato colonizzato?', opts: ['Ghana', 'Etiopia', 'Senegal', 'Tanzania'], a: 1, diff: 'hard', emoji: '🌍' },
  { q: 'Qual è la vera capitale della Nuova Zelanda?', opts: ['Auckland', 'Christchurch', 'Hamilton', 'Wellington'], a: 3, diff: 'hard', emoji: '🇳🇿' },
  { q: "Qual è l'aeroporto più trafficato del mondo?", opts: ['Dubai', 'Londra Heathrow', 'Atlanta Hartsfield', 'Beijing Capital'], a: 2, diff: 'hard', emoji: '🛫' },
  { q: 'Il Bosforo attraversa quale città?', opts: ['Atene', 'Sofia', 'Beirut', 'Istanbul'], a: 3, diff: 'hard', emoji: '🌉' },
  { q: 'Quale paese possiede la Groenlandia?', opts: ['Norvegia', 'Islanda', 'Svezia', 'Danimarca'], a: 3, diff: 'hard', emoji: '🧊' },
  { q: 'Qual è la capitale del Myanmar?', opts: ['Yangon', 'Mandalay', 'Naypyidaw', 'Bagan'], a: 2, diff: 'hard', emoji: '🇲🇲' },
  { q: "La bandiera del Nepal è l'unica al mondo che non è…", opts: ['Bicolore', 'Rettangolare', 'Con simboli', 'Con colori primari'], a: 1, diff: 'hard', emoji: '🇳🇵' },
  { q: "Quanti paesi fanno parte dell'Unione Europea?", opts: ['25', '26', '27', '28'], a: 2, diff: 'hard', emoji: '🇪🇺' },
  { q: 'Quale città ospita il museo con più visitatori al mondo?', opts: ['Washington D.C.', 'Parigi', 'Londra', 'New York'], a: 1, diff: 'hard', emoji: '🏛️' },
  { q: "Quale paese dell'Asia Centrale confina con il Caspio ed è privo di sbocco al mare?", opts: ['Azerbaijan', 'Armenia', 'Kazakistan', 'Georgia'], a: 2, diff: 'hard', emoji: '🗺️' },
  { q: 'Come si chiama la valuta ufficiale dell\'Islanda?', opts: ['Corona danese', 'Króna islandese', 'Euro', 'Corona norvegese'], a: 1, diff: 'hard', emoji: '🇮🇸' },
  { q: "Quale oceano ha la temperatura superficiale media più alta?", opts: ['Pacifico', 'Atlantico', 'Indiano', 'Artico'], a: 2, diff: 'hard', emoji: '🌡️' },
  { q: 'In quale paese si trova il Monastero di Meteora?', opts: ['Albania', 'Bulgaria', 'Serbia', 'Grecia'], a: 3, diff: 'hard', emoji: '⛪' },
  { q: 'Quale compagnia aerea è la più antica ancora operativa?', opts: ['KLM', 'Qantas', 'Lufthansa', 'British Airways'], a: 0, diff: 'hard', emoji: '✈️' },
];

export const DIFFICULTY_CONFIG = {
  easy:   { label: 'Facile',  points: 10, time: 25, emoji: '🟢', multiplier: 1 },
  medium: { label: 'Medio',   points: 20, time: 20, emoji: '🟡', multiplier: 1.5 },
  hard:   { label: 'Difficile', points: 30, time: 15, emoji: '🔴', multiplier: 2 },
} as const;

export function getQuestions(diff: Difficulty, count = 10): QuizQuestion[] {
  const pool = QUESTIONS.filter(q => q.diff === diff);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export interface ScoreEntry {
  score: number;
  correct: number;
  total: number;
  diff: Difficulty;
  date: string;
}

const LS_KEY = 'tit_quiz_scores';

export function getLeaderboard(): ScoreEntry[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}

export function saveScore(entry: ScoreEntry) {
  if (typeof window === 'undefined') return;
  const board = getLeaderboard();
  board.push(entry);
  board.sort((a, b) => b.score - a.score);
  localStorage.setItem(LS_KEY, JSON.stringify(board.slice(0, 20)));
}
