import { isUserError } from "../controllers/usersManager";
import { UserErrorMessages } from "../types/user";
import { itemInventoryManager } from "../utils/command";

const items = {
  blackcat_card: 10**10,
  royal_card: 65000,
  friend_role: 10**5,
  lover_role: 10**7
}

export default {
  info: {
    name: "choden",
    description: "Một nơi không ai biết đến, nơi mọi thứ có thể mua được... nếu bạn có đủ tiền.",
    version: "1.0.0",
    prefix: true,
    aliases: ["blackmarket"],
    usage: "choden [buy] [item_name]",
    credits: "NPK31"
  },
  

  execute: async ({api, message, manager, parsedMessage}) =>{
    const args = parsedMessage.args;
    const method = args[1];
    const nameItem = typeof args[2] === "string" ? args[2].toLowerCase() as keyof typeof items: undefined;

    if (!method) {
      const itemList = Object.entries(items).map(([item, price]) => `-> ${item}: $${price.toLocaleString()}`).join("\n");
      api.sendMessage(
        `🔥 Đây là danh sách vật phẩm đen 🔥\n${itemList}\n\n🛒 Để mua vật phẩm, dùng lệnh: -choden mua <tên>`,
        message.threadID
      );
      return;
    }

    try {
      if (method === "buy" || method === "mua") {
        if (!nameItem || !(nameItem in items)) return;

        const user = await manager.users.getUserByID(message.senderID, true);
        
        if (isUserError(user)) {
          return api.sendMessage(UserErrorMessages.vi[user], message.threadID);
        }

        const itemMoney = items[nameItem];

        if (user.balance < itemMoney) {
          return api.sendMessage("😬 Ôi không! Bạn không đủ tiền để mua cái này đâu...", message.threadID);
        }

        const updateBalance = await manager.users.updateUser(message.senderID, "balance", -itemMoney);

        if (isUserError(updateBalance)) return api.sendMessage(UserErrorMessages.vi[updateBalance], message.threadID);

        itemInventoryManager(message.senderID, "add", nameItem)
        
        return api.sendMessage(`💥 Bạn đã mua thành công ${nameItem} với giá $${itemMoney.toLocaleString()} tín dụng.\nQuá xịn luôn! ✨`, message.threadID);
      }
    } catch (error) {
      console.error("Error while handling blackmarket:", error);
    }
  },
} satisfies import("../types").BotCommand;