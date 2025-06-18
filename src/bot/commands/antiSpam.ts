import {
    antiSpamEnabled,
    antiSpamDuration,
    antiSpamMax,
    banDuration,
    updateAntiSpamConfig
  } from "../controllers/cooldownService";
  
  export default {
    info: {
      name: "antispam",
      description: "Quản lý chế độ chống spam lệnh",
      version: "1.0.0",
      prefix: true,
      permission: "admin",
      credits: "NPK31",
      aliases: ["antispam", "anti-spam", "antispam-config", "autoantispam"],
      hidden: true,
      usage: [
        "antispam <on/off>",
        "antispam view",
        "antispam toggle",
        "antispam max <số>",
        "antispam duration <giây>",
        "antispam ban <giây>"
      ],
      example: [
        "antispam on",
        "antispam off",
        "antispam toggle",
        "antispam max 10",
        "antispam duration 5",
        "antispam ban 15"
      ],
      category: "Admin",
    },
  
    execute: async ({api, message, parsedMessage}) =>{
      const { threadID } = message;
      const args = parsedMessage.args;
      const method = args[1]?.toLowerCase();
      const value = args[2];
  
      const showConfig = () => {
        return api.sendMessage(
          `📊 Cấu hình AntiSpam hiện tại:\n\n` +
          `• Trạng thái: ${antiSpamEnabled ? "🟢 BẬT" : "🔴 TẮT"}\n` +
          `• Spam tối đa: ${antiSpamMax} lần\n` +
          `• Thời gian spam: ${antiSpamDuration / 1000}s\n` +
          `• Thời gian ban: ${banDuration / 1000}s\n\n` +
          `📌 Mẹo xài:\n` +
          `• antispam toggle — Bật/tắt cực chill\n` +
          `• antispam max <số lần>\n` +
          `• antispam duration <giây>\n` +
          `• antispam ban <giây>`,
          threadID
        );
      };
  
      try {
        if (!method || ["view", "status", "config", "xem"].includes(method)) {
          return showConfig();
        }
  
        switch (method) {
          case "toggle": {
            const newState = !antiSpamEnabled;
            updateAntiSpamConfig({ antiSpamEnabled: newState });
            return api.sendMessage(
              `✅ AntiSpam đã được ${newState ? "🟢 bật lên rồi đó!" : "🔴 tắt mất tiêu!"}`,
              threadID
            );
          }
  
          case "on":
          case "bật":
          case "enable":
          case "true":
            updateAntiSpamConfig({ antiSpamEnabled: true });
            return api.sendMessage("✅ AntiSpam đã được 🟢 BẬT. Đừng spam nha 😤", threadID);
  
          case "off":
          case "tắt":
          case "disable":
          case "false":
            updateAntiSpamConfig({ antiSpamEnabled: false });
            return api.sendMessage("✅ AntiSpam đã được 🔴 TẮT. Muốn quẩy gì thì quẩy 🤪", threadID);
  
          case "max":
            if (!value || isNaN(Number(value))) return api.sendMessage("⚠️ Nhập số lần hợp lệ đi!", threadID);
            updateAntiSpamConfig({ antiSpamMax: Number(value) });
            return api.sendMessage(`✅ Đã set tối đa ${value} lần spam trước khi bị ban`, threadID);
  
          case "duration":
            if (!value || isNaN(Number(value))) return api.sendMessage("⚠️ Nhập số giây hợp lệ nha!", threadID);
            updateAntiSpamConfig({ antiSpamDuration: Number(value) * 1000 });
            return api.sendMessage(`✅ Khoảng thời gian spam: ${value}s`, threadID);
  
          case "ban":
            if (!value || isNaN(Number(value))) return api.sendMessage("⚠️ Nhập số giây hợp lệ cho thời gian ban!", threadID);
            updateAntiSpamConfig({ banDuration: Number(value) * 1000 });
            return api.sendMessage(`✅ Ai spam quá sẽ bị ban trong ${value}s 😈`, threadID);
  
          default:
            return api.sendMessage("❌ Không hiểu lệnh bạn gõ gì luôn á. Gõ `antispam` để xem hướng dẫn nha!", threadID);
        }
      } catch (err) {
        console.error(err);
        return api.sendMessage("❌ Có lỗi xảy ra khi xử lý! 😵‍💫", threadID);
      }
    },
  } satisfies import("../types").BotCommand;
  