// Profanity filter — Spanish & English bad words
// This list is intentionally broad to catch common obscenities

const BAD_WORDS_ES = [
  'puta', 'puto', 'mierda', 'verga', 'pendejo', 'pendeja', 'cabron', 'cabrón',
  'chingar', 'chingada', 'culero', 'culera', 'culo', 'marica', 'maricón',
  'maricon', 'joder', 'jodido', 'coño', 'cono', 'idiota', 'imbécil', 'imbecil',
  'estúpido', 'estupido', 'estúpida', 'estupida', 'mamón', 'mamon', 'huevón',
  'huevon', 'pinche', 'zorra', 'bastardo', 'bastarda', 'hdp', 'hijueputa',
  'malparido', 'malparida', 'gonorrea', 'hp', 'ctm', 'ptm', 'wtf',
  'carajo', 'puñeta', 'puneta', 'ojete', 'baboso', 'babosa',
];

const BAD_WORDS_EN = [
  'fuck', 'shit', 'bitch', 'ass', 'asshole', 'damn', 'dick', 'cock',
  'pussy', 'bastard', 'crap', 'cunt', 'whore', 'slut', 'nigger',
  'faggot', 'retard', 'moron', 'dumbass', 'motherfucker', 'stfu',
];

const ALL_BAD_WORDS = [...BAD_WORDS_ES, ...BAD_WORDS_EN];

// Build regex patterns that match whole words or partial matches
const patterns = ALL_BAD_WORDS.map(word => {
  // Escape regex special chars
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i');
});

export interface ProfanityResult {
  hasProfanity: boolean;
  detectedWords: string[];
  message: string;
}

/**
 * Checks a single string for profanity
 */
export function checkProfanity(text: string): ProfanityResult {
  if (!text || !text.trim()) return { hasProfanity: false, detectedWords: [], message: '' };

  const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const detected: string[] = [];

  for (let i = 0; i < ALL_BAD_WORDS.length; i++) {
    const word = ALL_BAD_WORDS[i];
    const normalizedWord = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(normalizedWord)) {
      detected.push(word);
    }
  }

  return {
    hasProfanity: detected.length > 0,
    detectedWords: [...new Set(detected)],
    message: detected.length > 0
      ? `⚠️ Contenido inapropiado detectado. Por favor, elimina el lenguaje ofensivo.`
      : '',
  };
}

/**
 * Checks multiple strings (title, description, exercises) for profanity
 */
export function checkRoutineProfanity(title: string, description: string, exercises: string[]): ProfanityResult {
  const allText = [title, description, ...exercises].join(' ');
  return checkProfanity(allText);
}
