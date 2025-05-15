import { readInventory } from "../utils/command";

export default {
  info: {
    name: "ruong",
    description: "Rương chứa đồ của bạn nè!",
    version: "1.0.0",
    prefix: true,
    aliases: ["inventory"],
    category: ["Info"],
    credits: "NPK31"
  },

  execute: ({api, message}) =>{
    const mentions = message.mentions;
    let userID = message.senderID; 

    if (mentions && Object.keys(mentions).length > 0) {
      const mentioned = Object.entries(mentions)[0];
      userID = mentioned[0]; 
    }

    try {
      const inventory = readInventory();
      const userInventory = inventory[userID] || [];

      if (userInventory.length === 0) {
        return api.sendMessage("Rương của bạn đang trống rỗng 😅.", message.threadID);
      }

      const itemCount: Record<string, number> = {};

      userInventory.forEach(item => {
        itemCount[item] = (itemCount[item] || 0) + 1;
      });

      const itemList = Object.entries(itemCount)
        .map(([item, count]) => `${item} ${count === 1 ? "": "x " + count}`)
        .join("\n╰┈➤ ");

      return api.sendMessage(`꧁༒••••••••𝑅ươ𝓃𝑔 𝒸ủ𝒶 𝒷ạ𝓃••••••••༒꧂\n\n╰┈➤ ${itemList}`, message.threadID);
      
    } catch (error) {
      console.error("Có lỗi gì đó khi lấy thông tin rương 🛑:", error);
      return api.sendMessage("Không thể lấy thông tin rương của bạn, thử lại sau nhé 😕.", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
