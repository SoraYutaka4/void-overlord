import { Command } from "../types";

export const splitCommands = (commands: Command[]) => {
    const result = {
        public: [] as Command[],
        hidden: [] as Command[],
    };

    for (const command of commands) {
        if (command.hidden) {
            result.hidden.push(command);
        } else {
            result.public.push(command);
        }
    }

    return result;
};

interface MessageCache {
    content: string;
    count: number;
  }
  
  const cache: MessageCache[] = [];
  
  const isDuplicate = (message: string, maxRetries: number = 2): boolean => {
    const entry = cache.find(entry => entry.content === message);
    return entry !== undefined && entry.count >= maxRetries;
  }
  
  const addToCache = (message: string) => {
    const entry = cache.find(entry => entry.content === message);
    
    if (entry) {
      entry.count += 1;
    } else {
      cache.push({ content: message, count: 1 });
    }
  }
  
  export { isDuplicate, addToCache };


export function removeDiacritics(input: string): string {
    return (input ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
}


export function getMatchedCommand(message: string, commandTriggers: Record<string,string[]>): string | null {
  const normalized = message.toLowerCase().trim();
  for (const [commandName, triggers] of Object.entries(commandTriggers)) {
      if (triggers.includes(normalized)) {
          return commandName;
      }
  }
  return null;
}

export function parseAmountWithSuffix(input: string): number {
  const baseUnits = ["k", "m", "b", "t", "q"];
  const extendedUnits: Record<string, number> = {};

  baseUnits.forEach((unit, i) => {
    extendedUnits[unit] = 10 ** ((i + 1) * 3);
  });

  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i < alphabet.length; i++) {
    for (let j = 0; j < alphabet.length; j++) {
      const suffix = alphabet[i] + alphabet[j];
      const power = 18 + (i * 26 + j) * 3;
      if (power > 308) break; 
      extendedUnits[suffix] = 10 ** power;
    }
  }

  const match = input.toLowerCase().match(/^([\d,.]+)([a-z]{0,2})$/);
  if (!match) return NaN;

  const [ , numStr, suffix ] = match;
  const cleanNum = parseFloat(numStr.replace(/,/g, ""));
  const multiplier = extendedUnits[suffix] || 1;

  return cleanNum * multiplier;
}