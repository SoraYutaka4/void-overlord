import { ICooldownManager } from "./cooldownManager";
import { API, CommandMessage as Message } from "../types";

export const messagesCount = new Map<string, number>();
export const banned = new Set<string>();
export let antiSpamEnabled = false;
export let antiSpamDuration = 1000 * 5; 
export let antiSpamMax = 5;
export let banDuration = 15 * 1000;

export const isCoolingDown = (
    cooldowns: ICooldownManager,
    targetID: string,
    type: string,
    duration?: number
) => {
    const cooldown = cooldowns.isOnCooldown(targetID, type);
    if (cooldown.onCooldown) return true;

    if (duration) {
        cooldowns.setCooldown(targetID, type, duration);
    }
    return false;
};


export const isSpam = (
  targetID: string,
  api: API,
  message: Message
): boolean | { status: true; message: string } => {
  if (!antiSpamEnabled) {
    messagesCount.clear();
    banned.clear();
    return false;
  }

  if (banned.has(targetID)) return true;

  const count = (messagesCount.get(targetID) ?? 0) + 1;
  messagesCount.set(targetID, count);

  if (count === 1) {
    setTimeout(() => messagesCount.set(targetID, 0), antiSpamDuration);
  }

  if (count >= antiSpamMax) {
    banned.add(targetID);

    const banMsg = `❌ Bạn đã bị tạm ban vì spam quá ${antiSpamMax} lần liên tục! ⛔\nThử lại sau ${banDuration / 1000}s.`;
    const threadID = message.threadID;

    api.sendMessage(banMsg, threadID);

    setTimeout(() => {
      banned.delete(targetID);
      api.sendMessage(`✅ Bạn đã được gỡ ban rồi đó! Nhớ spam vừa phải thôi nha 😅`, threadID);
    }, banDuration);

    return {
      status: true,
      message: banMsg,
    };
  }

  return false;
};

export const updateAntiSpamConfig = (config: Partial<{
  antiSpamEnabled: boolean;
  antiSpamDuration: number;
  antiSpamMax: number;
  banDuration: number;
}>) => {
  if (config.antiSpamEnabled !== undefined) antiSpamEnabled = config.antiSpamEnabled;
  if (config.antiSpamDuration !== undefined) antiSpamDuration = config.antiSpamDuration;
  if (config.antiSpamMax !== undefined) antiSpamMax = config.antiSpamMax;
  if (config.banDuration !== undefined) banDuration = config.banDuration;
};
