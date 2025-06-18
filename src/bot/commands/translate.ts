import { translateText, supportedLangs } from "../utils/langs";

export default {
  info: {
    name: "dich",
    description: "Dịch văn bản sang ngôn ngữ khác",
    version: "1.0.0",
    prefix: true,
    usage: "translate [ngôn ngữ] [văn bản]",
    example: "translate en Xin chào\ntranslate ja Tôi thích ăn phở",
    aliases: ["translate"],
    rules: {
      balance: 500,
    },
    category: ["Tool"],
    credits: "NPK31"
  },

  execute: async ({api, message, parsedMessage}) =>{
    try {
      const args = parsedMessage.args;
      const lang = args[1];
      const text = args.slice(2).join(" ");

      if (!lang || !text) {
        return api.sendMessage(
          "❌ Sai cú pháp!\n" +
            "➤ Dùng: translate [ngôn ngữ] [văn bản]\n" +
            "➤ Ví dụ: translate en Xin chào",
          message.threadID
        );
      }

      if (!supportedLangs.includes(lang.toLowerCase())) {
        return api.sendMessage(
          `❌ Mã ngôn ngữ "${lang}" không hợp lệ!\nVí dụ: en (English), vi (Tiếng Việt), ja (Tiếng Nhật)...`,
          message.threadID
        );
      }

      const translated = await translateText(text, lang);

      if (!translated) {
        return api.sendMessage("🚫 Không thể dịch văn bản. Vui lòng thử lại sau!", message.threadID);
      }

      api.sendMessage(`🌐 Dịch sang [${lang}]:\n${translated}`, message.threadID);
    } catch (err) {
      console.error("❌ Lỗi dịch:", err);
      api.sendMessage("🚫 Có lỗi xảy ra khi dịch văn bản!", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
