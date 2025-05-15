import { getPowerInfo } from "../controllers/requestToApi";
import { isUserError } from "../controllers/usersManager";
import { UserErrorMessages, Power } from "../types/user";

export default {
  info: {
    name: "chiso",
    description: "Xem chỉ số sức mạnh và cấp độ của bạn! 💪🎮",
    version: "1.0.0",
    prefix: true,
    aliases: ["stat", "stats"],
    category: "Info",
    credits: "NPK31"
  },

  execute: async ({api, message, manager}) =>{
    try {
      const user = await manager.users.getUserByID(message.senderID, true);

      if (isUserError(user)) {
        return api.sendMessage(UserErrorMessages.vi[user], message.threadID);
      }

      const power: Power = await getPowerInfo(message.senderID, "json");

      const level = user.level;
      const exp = user.exp; 
      const atk = power.attack;
      const def = power.defense;

      const userStatsMessage = `
        **🎮 Chỉ số của bạn:**
        - 🔥 Cấp độ: ${level}
        - 💎 Kinh nghiệm: ${exp} XP
        - ⚔️ Tấn công: ${atk}
        - 🛡️ Phòng thủ: ${def}
      `;

      return api.sendMessage(userStatsMessage, message.threadID);

    } catch (error) {
      console.error("Lỗi khi lấy thông tin người chơi:", error);
      return api.sendMessage("😣 Ôi, đã có lỗi xảy ra khi lấy thông tin của bạn. Thử lại sau nhé! 🔄", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
