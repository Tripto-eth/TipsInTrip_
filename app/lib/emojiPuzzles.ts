import type { Difficulty } from './quizData';

type EmojiCategory = 'paese' | 'citta' | 'cibo' | 'compagnia';

interface EmojiPuzzle {
  emoji: string;
  answer: string;
  category: EmojiCategory;
  diff: Difficulty;
}

export const CATEGORY_LABELS: Record<EmojiCategory, string> = {
  paese:     '🌍 Paese',
  citta:     '🏙️ Città',
  cibo:      '🍽️ Da mangiare',
  compagnia: '✈️ Compagnia aerea',
};

export interface EmojiRound {
  emoji: string;
  answer: string;
  categoryLabel: string;
  opts: [string, string, string, string];
  a: 0 | 1 | 2 | 3;
}

export const EMOJI_PUZZLES: EmojiPuzzle[] = [
  // ── EASY ──────────────────────────────────────────────────────────────────
  // Paesi
  { emoji: '🗼🥖🍷',  answer: 'Francia',       category: 'paese', diff: 'easy' },
  { emoji: '🍕🛵🤌',  answer: 'Italia',         category: 'paese', diff: 'easy' },
  { emoji: '🗽🦅🍔',  answer: 'USA',            category: 'paese', diff: 'easy' },
  { emoji: '🏯🌸🍣',  answer: 'Giappone',       category: 'paese', diff: 'easy' },
  { emoji: '🍺🏰🌭',  answer: 'Germania',       category: 'paese', diff: 'easy' },
  { emoji: '🌷🧀🚲',  answer: 'Olanda',         category: 'paese', diff: 'easy' },
  { emoji: '🍀☘️🎵',  answer: 'Irlanda',        category: 'paese', diff: 'easy' },
  { emoji: '💃🎸☀️',  answer: 'Spagna',         category: 'paese', diff: 'easy' },
  { emoji: '🦘🏏🌞',  answer: 'Australia',      category: 'paese', diff: 'easy' },
  { emoji: '🍁🏒❄️',  answer: 'Canada',         category: 'paese', diff: 'easy' },
  { emoji: '🐉🏮🍜',  answer: 'Cina',           category: 'paese', diff: 'easy' },
  { emoji: '🌹🏔️🍫',  answer: 'Svizzera',       category: 'paese', diff: 'easy' },
  { emoji: '🎻🎡☕',  answer: 'Austria',         category: 'paese', diff: 'easy' },
  { emoji: '❄️🐟🌋',  answer: 'Islanda',        category: 'paese', diff: 'easy' },
  { emoji: '🦁☕🎭',  answer: 'Regno Unito',    category: 'paese', diff: 'easy' },
  { emoji: '🏔️🌿🦙',  answer: 'Perù',           category: 'paese', diff: 'easy' },
  { emoji: '🌴🎉🎊',  answer: 'Brasile',        category: 'paese', diff: 'easy' },
  { emoji: '🐘🌺🍛',  answer: 'India',          category: 'paese', diff: 'easy' },
  { emoji: '🦅🌵🎭',  answer: 'Messico',        category: 'paese', diff: 'easy' },
  { emoji: '🌴🦓🌅',  answer: 'Kenya',          category: 'paese', diff: 'easy' },
  // Città
  { emoji: '🎡🥐☀️',  answer: 'Parigi',         category: 'citta', diff: 'easy' },
  { emoji: '🎭🚤🌊',  answer: 'Venezia',        category: 'citta', diff: 'easy' },
  { emoji: '🏟️🌊☀️',  answer: 'Barcellona',     category: 'citta', diff: 'easy' },
  { emoji: '🗽🌆🍎',  answer: 'New York',       category: 'citta', diff: 'easy' },
  { emoji: '⛩️🌸🏙️',  answer: 'Tokyo',          category: 'citta', diff: 'easy' },
  { emoji: '🎲💰🎰',  answer: 'Las Vegas',      category: 'citta', diff: 'easy' },
  { emoji: '🏟️⚽🌆',  answer: 'Roma',           category: 'citta', diff: 'easy' },
  // Cibo → paese
  { emoji: '🍕🍝🍷',  answer: 'Italia',         category: 'cibo', diff: 'easy' },
  { emoji: '🍣🍱🍜',  answer: 'Giappone',       category: 'cibo', diff: 'easy' },
  { emoji: '🥐🧀🥗',  answer: 'Francia',        category: 'cibo', diff: 'easy' },
  { emoji: '🌮🌯🫔',  answer: 'Messico',        category: 'cibo', diff: 'easy' },
  { emoji: '🍔🥞🌽',  answer: 'USA',            category: 'cibo', diff: 'easy' },
  { emoji: '🥘🥗🍷',  answer: 'Spagna',         category: 'cibo', diff: 'easy' },

  // ── MEDIUM ────────────────────────────────────────────────────────────────
  // Paesi
  { emoji: '🌹🔴🎵',  answer: 'Portogallo',     category: 'paese', diff: 'medium' },
  { emoji: '🌷🏰🍫',  answer: 'Belgio',         category: 'paese', diff: 'medium' },
  { emoji: '🎭🍷🌊',  answer: 'Croazia',        category: 'paese', diff: 'medium' },
  { emoji: '🏔️🌸🙏',  answer: 'Nepal',          category: 'paese', diff: 'medium' },
  { emoji: '🌊🏄🌺',  answer: 'Indonesia',      category: 'paese', diff: 'medium' },
  { emoji: '🐪🏜️🌙',  answer: 'Marocco',        category: 'paese', diff: 'medium' },
  { emoji: '🌿🦜🏔️',  answer: 'Costa Rica',     category: 'paese', diff: 'medium' },
  { emoji: '🐊🌴☀️',  answer: 'Egitto',         category: 'paese', diff: 'medium' },
  { emoji: '🦒🌅🌍',  answer: 'Tanzania',       category: 'paese', diff: 'medium' },
  { emoji: '💐🕌🌙',  answer: 'Turchia',        category: 'paese', diff: 'medium' },
  { emoji: '🎭🍷🏰',  answer: 'Rep. Ceca',      category: 'paese', diff: 'medium' },
  { emoji: '🌊🏝️🐠',  answer: 'Maldive',        category: 'paese', diff: 'medium' },
  { emoji: '🎿🏔️🐟',  answer: 'Norvegia',       category: 'paese', diff: 'medium' },
  { emoji: '🌴🐊🎶',  answer: 'Cuba',           category: 'paese', diff: 'medium' },
  { emoji: '💎🌍🏔️',  answer: 'Sudafrica',      category: 'paese', diff: 'medium' },
  { emoji: '🌸🎎🏯',  answer: 'Corea del Sud',  category: 'paese', diff: 'medium' },
  { emoji: '🌊🐋🏔️',  answer: 'Nuova Zelanda',  category: 'paese', diff: 'medium' },
  { emoji: '🌴🥥🌺',  answer: 'Fiji',           category: 'paese', diff: 'medium' },
  { emoji: '🏔️🌿☕',  answer: 'Colombia',       category: 'paese', diff: 'medium' },
  { emoji: '🌊🏰🎭',  answer: 'Montenegro',     category: 'paese', diff: 'medium' },
  // Città
  { emoji: '🌉🌁🚃',  answer: 'San Francisco',  category: 'citta', diff: 'medium' },
  { emoji: '🏛️☀️🌊',  answer: 'Atene',          category: 'citta', diff: 'medium' },
  { emoji: '🌃🌊🍕',  answer: 'Napoli',         category: 'citta', diff: 'medium' },
  { emoji: '🎭🌹🍺',  answer: 'Praga',          category: 'citta', diff: 'medium' },
  { emoji: '🏰🌊⚓',  answer: 'Dubrovnik',      category: 'citta', diff: 'medium' },
  { emoji: '🎡🌊🏰',  answer: 'Vienna',         category: 'citta', diff: 'medium' },
  { emoji: '🏰🎶🍺',  answer: 'Monaco',         category: 'citta', diff: 'medium' },
  { emoji: '🌺🏄🌊',  answer: 'Honolulu',       category: 'citta', diff: 'medium' },
  { emoji: '🏛️💐🌍',  answer: 'Il Cairo',       category: 'citta', diff: 'medium' },
  { emoji: '🌊🏝️⛵',  answer: 'Santorini',      category: 'citta', diff: 'medium' },
  { emoji: '🕌🌉🌙',  answer: 'Istanbul',       category: 'citta', diff: 'medium' },
  { emoji: '🌉🎻🍺',  answer: 'Budapest',       category: 'citta', diff: 'medium' },
  // Cibo → paese
  { emoji: '🫕🍞🫒',  answer: 'Grecia',         category: 'cibo', diff: 'medium' },
  { emoji: '🍜🌶️🥜',  answer: 'Thailandia',     category: 'cibo', diff: 'medium' },
  { emoji: '🫔🥩🍋',  answer: 'Turchia',        category: 'cibo', diff: 'medium' },
  { emoji: '🍛🥥🌶️',  answer: 'India',          category: 'cibo', diff: 'medium' },
  { emoji: '🥩🌿🍷',  answer: 'Argentina',      category: 'cibo', diff: 'medium' },
  { emoji: '🍲🌶️🥜',  answer: 'Vietnam',        category: 'cibo', diff: 'medium' },
  { emoji: '🫕🌶️🧆',  answer: 'Marocco',        category: 'cibo', diff: 'medium' },
  { emoji: '🍲🥩🌿',  answer: 'Etiopia',        category: 'cibo', diff: 'medium' },
  { emoji: '🥟🍜🥢',  answer: 'Cina',           category: 'cibo', diff: 'medium' },

  // ── HARD ──────────────────────────────────────────────────────────────────
  // Paesi
  { emoji: '🏔️🌹👑',  answer: 'Bhutan',         category: 'paese', diff: 'hard' },
  { emoji: '❄️🐻‍❄️🌊',  answer: 'Groenlandia',    category: 'paese', diff: 'hard' },
  { emoji: '🌴🔥🏝️',  answer: 'Capo Verde',     category: 'paese', diff: 'hard' },
  { emoji: '🐘🌿🌊',  answer: 'Sri Lanka',      category: 'paese', diff: 'hard' },
  { emoji: '🌿🍵🏔️',  answer: 'Georgia',        category: 'paese', diff: 'hard' },
  { emoji: '🌺🌊🏝️',  answer: 'Tahiti',         category: 'paese', diff: 'hard' },
  { emoji: '🏜️🌟🏰',  answer: 'Oman',           category: 'paese', diff: 'hard' },
  { emoji: '🌊🏔️🐧',  answer: 'Cile',           category: 'paese', diff: 'hard' },
  { emoji: '🏰🍷🌿',  answer: 'Armenia',        category: 'paese', diff: 'hard' },
  { emoji: '🎭🌊☀️',  answer: 'Albania',        category: 'paese', diff: 'hard' },
  // Città
  { emoji: '🏔️☕🌿',  answer: 'Medellín',       category: 'citta', diff: 'hard' },
  { emoji: '🌊🌈🏔️',  answer: 'Cape Town',      category: 'citta', diff: 'hard' },
  { emoji: '🌴🌙🏮',  answer: 'Marrakech',      category: 'citta', diff: 'hard' },
  { emoji: '🌿🏯🌸',  answer: 'Kyoto',          category: 'citta', diff: 'hard' },
  { emoji: '🌊🏔️❄️',  answer: 'Tromsø',         category: 'citta', diff: 'hard' },
  { emoji: '🌿🌴🎵',  answer: 'Cartagena',      category: 'citta', diff: 'hard' },
  { emoji: '🌊🏝️🌴',  answer: 'Zanzibar',       category: 'citta', diff: 'hard' },
  { emoji: '🏔️🌺🌊',  answer: 'Queenstown',     category: 'citta', diff: 'hard' },
  // Compagnie aeree
  { emoji: '✈️🟠⚡',   answer: 'easyJet',        category: 'compagnia', diff: 'hard' },
  { emoji: '✈️🟡⭕🔵', answer: 'Ryanair',        category: 'compagnia', diff: 'hard' },
  { emoji: '✈️🌙⭐🔴', answer: 'Turkish Airlines', category: 'compagnia', diff: 'hard' },
  { emoji: '✈️🦅🔵🟡', answer: 'Lufthansa',      category: 'compagnia', diff: 'hard' },
  { emoji: '✈️💎🌙',   answer: 'Emirates',       category: 'compagnia', diff: 'hard' },
  { emoji: '✈️🦁👑',   answer: 'British Airways', category: 'compagnia', diff: 'hard' },
  { emoji: '✈️🌺🔵',   answer: 'Air France',     category: 'compagnia', diff: 'hard' },
  { emoji: '✈️🔵⚪🔴', answer: 'ITA Airways',    category: 'compagnia', diff: 'hard' },
  { emoji: '✈️🦅🔵⭐', answer: 'United Airlines', category: 'compagnia', diff: 'hard' },
  { emoji: '✈️🌸🔴',   answer: 'Japan Airlines', category: 'compagnia', diff: 'hard' },
];

export function getEmojiRound(diff: Difficulty, count = 10): EmojiRound[] {
  const pool = EMOJI_PUZZLES.filter(p => p.diff === diff);
  const selected = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));
  const allAnswers = [...new Set(pool.map(p => p.answer))];

  return selected.map(puzzle => {
    const wrongs = allAnswers
      .filter(a => a !== puzzle.answer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const all = [...wrongs, puzzle.answer].sort(() => Math.random() - 0.5);
    const a = all.indexOf(puzzle.answer) as 0 | 1 | 2 | 3;

    return {
      emoji: puzzle.emoji,
      answer: puzzle.answer,
      categoryLabel: CATEGORY_LABELS[puzzle.category],
      opts: all as [string, string, string, string],
      a,
    };
  });
}
