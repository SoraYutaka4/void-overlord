function getValueIgnoreCase(query: Record<string, any>, aliases: string[]): string | null {
    for (const key of aliases) {
      const value = query[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value).trim();
      }
    }
    return null;
  }
  
  export default {
    info: {
      name: "setname",
      description: "Đặt biệt danh",
      version: "1.0.0",
      prefix: true,
      usage: "setname <@user> tên=<biệt danh>",
      freeUse: true,
    },
  
    execute: ({ api, message, parsedMessage, normalizeText }) => {
      const { query } = parsedMessage;
      const mentions = Object.keys(message.mentions || {});
  
      if (mentions.length === 0) {
        api.sendMessage("🚨 Bạn phải tag người muốn đổi tên nhé bro 🫡", message.threadID);
        return;
      }
  
      const normalizedQuery = Object.fromEntries(
        Object.entries(query).map(([key, value]) => [normalizeText(key), value])
      );
  
      const newName = getValueIgnoreCase(normalizedQuery, ["name", "ten", "bd", "bietdanh"]);
  
      if (!newName) {
        api.sendMessage("⚠️ Bạn chưa nhập tên mới. Dùng: setname <@user> tên=<biệt danh>", message.threadID);
        return;
      }
  
      const userID = mentions[0];
  
      api.changeNickname(newName, message.threadID, userID, (err) => {
        const msg = err
          ? "❌ Đổi biệt danh thất bại, thử lại sau nhé!"
          : `✅ Đã đổi biệt danh của ${Object.values(message.mentions)[0]} thành "${newName}"`;
        api.sendMessage(msg, message.threadID);
      });
    },
  } satisfies import("../types").BotCommand;
  