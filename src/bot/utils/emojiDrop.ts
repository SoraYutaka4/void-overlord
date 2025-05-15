export type EmojiDropConfig = {
    enabled: boolean;
    emojis?: string[];
    chance?: number;
    delay?: {
        min: number;
        max: number;
    };
}

export function shouldDropEmoji(drop?: EmojiDropConfig): drop is EmojiDropConfig {
    return !!(
      drop?.enabled &&
      (drop.chance ?? 0) > Math.random() &&
      drop.emojis &&
      drop.emojis?.length &&
      drop.emojis.length > 0 &&
      drop.delay &&
      drop.delay?.min != null &&
      drop.delay?.max != null &&
      drop.delay.min >= 0 &&
      drop.delay.max >= drop.delay.min
    );
  }
  