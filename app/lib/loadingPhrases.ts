// Frasi mostrate durante la ricerca voli (chiamata Kiwi).
// Vengono scelte 2-3 a caso e mostrate in sequenza con piccoli delay,
// per dare all'utente un feedback "vivo" mentre Claude aspetta i risultati.
// Puoi aggiungere, rimuovere o modificare le frasi liberamente.

export const LOADING_PHRASES: string[] = [
  '🔍 *Sto cercando voli...*',
  '✈️ *Sto negoziando con i piloti...*',
  '💰 *Confronto i prezzi migliori...*',
  '🌍 *Attraverso il globo per te...*',
  '📡 *In contatto con la torre di controllo...*',
  '☁️ *Volando sopra le nuvole...*',
  '⛽ *Facendo il pieno al jet...*',
  '🧳 *Controllo i bagagli disponibili...*',
  '🗺️ *Analizzo le rotte più convenienti...*',
  '🕵️ *Stano le offerte nascoste...*',
  '🎟️ *Strappo i biglietti migliori...*',
  '⏱️ *Ottimizzo gli orari...*',
  '🚀 *Acceleratori al massimo...*',
];

// Quante frasi mostrare durante ogni attesa (min, max)
export const PHRASES_PER_WAIT = { min: 2, max: 3 };

// Delay tra una frase e la successiva, in millisecondi
export const PHRASE_DELAY_MS = 1100;
