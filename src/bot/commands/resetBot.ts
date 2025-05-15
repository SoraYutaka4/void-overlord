import { runFileByPath } from "../utils/file";

export default {
  info: {
    name: "reset-bot",
    description: "Khởi động lại từ xa",
    version: "1.0.0",
    permission: "admin",
    prefix: true,
    hidden: true,
    category: "Admin",
    credits: "NPK31",
    aliases: ["rs", "reset"]
  },

  execute: async ({api, message}) => {
    try {
      api.sendMessage(`🔄 Đang Reset ...`, message.threadID);

      const resetFile = process.platform === 'win32'
        ? "./src/bot/scripts/rs-cache.bat"  
        : "./src/bot/scripts/rs-cache.sh";  

      await runFileByPath(resetFile); 

    } catch (err) {
      api.sendMessage(`❌ Không thể reset bot: ${err instanceof Error ? err.message : String(err)}`, message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
