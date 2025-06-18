import { New_Message } from "../types";

function removeDiacritics(input: string): string {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default {
  info: {
    name: ["lay", "lấy", "get"],
    description: "Lấy thông tin hiện tại",
    version: "1.1.0",
    prefix: false,
    hidden: true,
    usage: "lay [group_id | bot_id | sender_id | all]",
    example: "lay thread_id",
  },

  execute: async ({api, message, parsedMessage}) =>{
    const rawArgs = parsedMessage.args.slice(1).map(arg => removeDiacritics(arg.toLowerCase()));
    const method = rawArgs.join("_");
    
    const send = (msg: New_Message | string ) => api.sendMessage(
        typeof msg === "object" ? {
            ...msg, 
            avoid: {
                obfuscate: false
            }
        }: {
            body: msg,
            avoid: {
                obfuscate: false
            }
        }, message.threadID);

    try {
        switch(method){
            case "thread_id": 
            case "group_id":
                return send(`🧵 Thread ID: ${message.threadID}`);

            case "current_id": 
            case "user_id":
            case "bot_id":
                return send(`🤖 Bot ID: ${api.getCurrentUserID()}`);

            case "sender_id":
            case "author_id":
                return send(`👤 Sender ID: ${message.senderID}`);

            case "tatca":
            case "all":
                return send(
                    `ℹ️ Thông tin hiện tại:\n` +
                    `🧵 Thread ID: ${message.threadID}\n` +
                    `👤 Sender ID: ${message.senderID}\n` +
                    `🤖 Bot ID: ${api.getCurrentUserID()}`
                );

        }
    } catch (error) {
        console.error("Lỗi khi xử lý lệnh 'lay':", error);
        return send("⚠️ Đã xảy ra lỗi khi xử lý yêu cầu.");
    }
  },
} satisfies import("../types").BotCommand;
