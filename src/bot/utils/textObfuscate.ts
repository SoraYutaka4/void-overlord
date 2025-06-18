import { transformTextWithStyle, style } from "./styledFont";

const validStyles = [
    "boldSerif",
    "boldSansSerif",
    "italicSerif",
    "italicSansSerif",
    "boldItalicSerif",
    "boldItalicSansSerif",
    "handwrittenBold",
    "monospace"
];

const invisibleChars = ["\u200B", "\u2060", "\uFEFF", "ㅤ", "⠀",];
const harmlessEmojis = [
    "🌀", "🛸", "🗿", "🎭", "🔅", "🔱", "🧿", "📯", "🦜", "🪁", "🛤",
    "🛰", "🦚", "🦞", "🦢", "🦔", "🌑", "🌕", "🌗", "🎐", "🧩", "🖇", "🗃", "🗄", "🔎", "🏺", "🗝",
    "🎏", "🀄", "🎴", "🃏", "🕯", "😀", "😃", "😄", "😁", "😆", "😎", "🤩", "🥳", "😊", "😇", "😉", "😌"
];
const replacements = {
    "a": ["а", "𝖆", "𝐚", "𝗮", "𝚊"],
    "o": ["о", "𝖔", "𝐨", "𝗼", "𝚘"],
    "e": ["е", "𝖊", "𝐞", "𝗲", "𝚎"],
    "i": ["і", "𝖎", "𝐢", "𝗶", "𝚒"],
    "l": ["𝖑", "𝐥", "𝗹"],
    "s": ["𝖘", "𝐬", "𝗌", "𝘴"],
    "t": ["𝖙", "𝐭", "𝗍", "𝚝"],
};

function insertInvisiblePadding(text: string) {
    const count = Math.floor(Math.random() * 2) + 1;
    const padding = Array.from({ length: count }, () => invisibleChars[Math.floor(Math.random() * invisibleChars.length)]).join("");
    return text + padding;
}

function randomizeText(input: string) {
    return input.split(" ").map((word) => {
        const newWord = word.split("").map(char => {
            if (char === char.toLowerCase() && Math.random() < 0.55 && char in replacements) {
                return replacements[char as keyof typeof replacements][Math.floor(Math.random() * replacements[char as keyof typeof replacements].length)];
            }

            return char;
        }).join("");

        return newWord;
    }).join(" ");
}

function processLongText(input: string, emoji: boolean) {
    return input.split(/(\.|!|\?|\n)/g).map((sentence) => {
        const trimmed = sentence.trim();

        if (trimmed.length < 10) return sentence;

        if (trimmed) {
            sentence = randomizeText(sentence);
        }

        if (emoji && /[.!?;]/.test(sentence)) {
            if (!hasRepeatedPunctuation(sentence) && Math.random() < 0.3) {
                sentence += " " + harmlessEmojis[Math.floor(Math.random() * harmlessEmojis.length)];
            }
        }

        sentence = sentence.split("").map(char => {
            if (Math.random() < 0.15) { 
                sentence = randomizeText(sentence);
            }
            return char;
        }).join("");

        if (sentence === sentence.toLowerCase() && Math.random() < 0.1) {
            sentence = insertInvisiblePadding(sentence);
        }

        return sentence;
    }).join("");
}

function hasRepeatedPunctuation(word: string) {
    const punctuation = /[.!?;]/;
    return punctuation.test(word) && new Set(word.split("")).size === 1;
}

function maybeApplyStyle(input: string): string {
    if (Math.random() < 0.45) {
        const style = validStyles[Math.floor(Math.random() * validStyles.length)] as style;
        return transformTextWithStyle(input, style) || input;
    }
    return input;
}

export default function ObfuscateText(input: string, emoji: boolean = true): string {
    let obfuscated = processLongText(input, emoji);
    obfuscated = maybeApplyStyle(obfuscated);
    return obfuscated;
}
