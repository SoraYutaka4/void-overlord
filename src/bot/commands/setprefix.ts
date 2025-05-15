import { setPrefix, runFileByPath } from "../utils";

export default {
  info: {
    name: "setprefix",
    description: "Đặt prefix cho bot",
    version: "1.0.0",
    prefix: true,
    category: "Admin",
    usage: "setprefix <prefix>",
    example: [
        "setprefix !",
        "setprefix ?",
        "setprefix $",
    ],
    credits: "NPK31",
    permission: "admin",
    cooldown: 3000,
    hidden: true
  },

  execute: async ({api, message, parsedMessage}) => {
    const { args } = parsedMessage;
    const prefix = args[1];

    if (!prefix) {
      return api.sendMessage("Vui lòng nhập prefix mới!", message.threadID, undefined, message.messageID);
    }

    if (prefix.length > 5) {
      return api.sendMessage("Prefix không được dài quá 5 ký tự!", message.threadID, undefined, message.messageID);
    }

    api.sendMessage("Đang thay đổi prefix...", message.threadID, undefined, message.messageID);
    setPrefix(prefix);
    
    const resetFile = process.platform === 'win32'
      ? "./src/bot/scripts/rs-cache.bat"  
      : "./src/bot/scripts/rs-cache.sh";  

    try {
      await runFileByPath(resetFile);
      api.sendMessage(`Prefix đã được thay đổi thành ${prefix}!`, message.threadID, undefined, message.messageID);
    } catch (error) {
      console.error("An error occurred while running the reset file:", error);
      api.sendMessage("Đã có lỗi khi thay đổi prefix, vui lòng thử lại!", message.threadID, undefined, message.messageID);
    }

  }
} satisfies import("../types").BotCommand;