import { isUserError } from "../controllers/usersManager";
import { UserErrorMessages } from "../types/user";

export default {
  info: {
    name: "level",
    description: "Xem level hiện tại của bạn hoặc người khác.",
    version: "1.0.0",
    prefix: true,
    category: "Info",
    usage: "level [@user]",
    example: ["level", "level @NguyenVanA"],
    credits: "NPK31"
  },

  execute: async ({api, message, manager}) =>{
    const mentions = message.mentions;
    let userID = message.senderID; 
    let checkMentions = false;

    if (mentions && Object.keys(mentions).length > 0) {
      const mentioned = Object.entries(mentions)[0];
      userID = mentioned[0];
      checkMentions = true;
    }

    if (checkMentions){
      const user = await manager.users.getUserByID(userID, true);
      if (isUserError(user)) {
        return api.sendMessage(UserErrorMessages.vi[user], message.threadID);
      }
    }

    try {
      const user = await manager.users.getUserByID(userID, true);

      if (isUserError(user)) {
        return api.sendMessage(UserErrorMessages.vi[user], message.threadID);
      }

      const name = mentions && Object.keys(mentions).length > 0
      ? `${mentions[Object.keys(mentions)[0]].replace(/@/g, "")}`
      : "bạn";

      return api.sendMessage(`🔎 Level hiện tại của ${name} là: ${user.level}`, message.threadID);

    } catch (error) {
      console.error("Level command error:", error);
      return api.sendMessage("⚠️ Có lỗi xảy ra khi lấy thông tin level.", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
