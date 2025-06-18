import { createTransaction } from "../controllers/requestToApi";
import { isUserError } from "../controllers/usersManager";
import { UserErrorMessages } from "../types/user";

export function parseAmount(input: string): number {
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

export default {
    info: {
        name: "chuyentien",
        description: "Chuyển tiền cho người dùng khác",
        version: "1.0.0",
        prefix: true,
        aliases: ["transaction", "chuyenkhoan"],
        rules: {
            balance: 100,
        },
        usage: "chuyentien <@user> <số tiền>", 
        example: "chuyentien @user123 1000", 
        category: "Bank",
        credits: "NPK31"
    },
  
    execute: async ({api, message, manager, parsedMessage}) =>{
        try {
            const mentions = message.mentions;
            if (!mentions || Object.keys(mentions).length === 0) {
                api.sendMessage("Bạn cần đề cập đến người nhận!", message.threadID);
                return;
            }
      
            const senderID = message.senderID;
            const receiverID = Object.entries(mentions)[0][0];
    
            const user = await manager.users.getUserByID(receiverID, true);
            if (isUserError(user)) return api.sendMessage(UserErrorMessages.vi[user], message.threadID);

            const sender = await manager.users.getUserByID(senderID, true);
            if (isUserError(sender)) return api.sendMessage(UserErrorMessages.vi[sender], message.threadID);
    
            const value = parseAmount(parsedMessage.args[parsedMessage.args.length - 1]); 
      
            if (isNaN(value) || value <= 0 || value > sender.balance) {
                api.sendMessage("Số tiền bạn nhập không hợp lệ!", message.threadID);
                return;
            }
      
            const res = await createTransaction({
                id1: senderID,
                id2: receiverID,
                value: value,  
                img: "true"
            }, "stream");
      
            api.sendMessage({
                attachment: [res]
            }, message.threadID);
        } catch (error) {
            console.error("Error in transaction command:", error);
            api.sendMessage("Đã xảy ra lỗi trong quá trình thực hiện giao dịch.", message.threadID);
        }
    },
} satisfies import("../types").BotCommand;
