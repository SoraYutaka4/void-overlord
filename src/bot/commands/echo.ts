import { isDuplicate, addToCache } from "../utils/common";

export default {
  info: {
    name: "copy",
    description: "Nhái lại người khác (1 lần) 😛",
    version: "1.0.0",
    prefix: true,
    aliases: ["echo", "nhai"],
    category: ["Fun"],
    credits: "NPK31"
  },

  execute: ({api, message, parsedMessage}) =>{
    const args = parsedMessage.args.slice(1);

    if (args.length === 0) return;
    const content = args.join(" ");

    const maxRetries = 1;
    if (isDuplicate(content, maxRetries)) {
      return;
    }

    const maxLength = 500;
    if (content.length > maxLength) {
      return api.sendMessage(`Tin nhắn quá dài. Vui lòng chỉ nhập tối đa ${maxLength} ký tự.`, message.threadID);
    }

    api.sendMessage({
        body: content,
        avoid: {
          obfuscate: false
        }
    }, message.threadID);

    addToCache(content);
  },
} satisfies import("../types").BotCommand;
