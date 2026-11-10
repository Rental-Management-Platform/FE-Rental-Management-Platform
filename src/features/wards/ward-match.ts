// Only types are imported, and with `import type`, so this file runs straight under Node for a
// quick check (`node --experimental-strip-types`) with nothing else to load.
import type { Ward } from "@/lib/api/types";

// The most words and the most characters of one word that count (spec 0015, AC-4). A longer
// text is cut here, so a very long paste cannot make the match slow.
const MAX_WORDS = 6;
const MAX_WORD_LENGTH = 50;

/**
 * Lower case, no accents, `đ` as `d`, spaces merged and trimmed. "Hoà", "Hòa" and "hoa" give
 * the same text, and "Đặc khu" gives "dac khu". Never throws, for any string.
 */
export const foldWardText = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();

const wordsOf = (folded: string): string[] =>
  folded === "" ? [] : folded.split(" ");

/**
 * The wards whose name matches what was typed, in the order to show them.
 *
 * A ward matches when every typed word is the start of at least one word of its name, with
 * accents ignored. Nothing typed matches everything, in the catalog order. Otherwise the wards
 * are ordered by where in the name the first typed word matches (the earlier word first), and
 * wards that tie keep the catalog order. So "ben" puts "Phường Bến Thành" before "Phường An Bên".
 * Only the name is compared, not the province. Pure: it never changes `wards`.
 */
export const matchWards = (wards: readonly Ward[], text: string): Ward[] => {
  const typed = wordsOf(foldWardText(text))
    .slice(0, MAX_WORDS)
    .map((word) => word.slice(0, MAX_WORD_LENGTH));
  if (typed.length === 0) return [...wards];

  const ranked: { ward: Ward; index: number; position: number }[] = [];
  wards.forEach((ward, index) => {
    const nameWords = wordsOf(foldWardText(ward.name));
    const everyWordFound = typed.every((word) =>
      nameWords.some((nameWord) => nameWord.startsWith(word)),
    );
    if (!everyWordFound) return;
    const position = nameWords.findIndex((nameWord) =>
      nameWord.startsWith(typed[0]),
    );
    ranked.push({ ward, index, position });
  });

  return ranked
    .sort((a, b) => a.position - b.position || a.index - b.index)
    .map(({ ward }) => ward);
};
