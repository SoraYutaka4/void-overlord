import { getBank } from "../controllers/requestToApi";
import { isUserError } from "../controllers/usersManager";
import { isAdministrator } from "../utils/command";

export default {
  info: {
    name: "bank",
    description: "Bank này không có lãi suất, nhưng có lãi tình bạn 🤝💸",
    version: "1.0.0",
    prefix: true,
    cooldown: 7000,
    category: "Bank",
    aliases: ["bank2"],
    credits: "NPK31"
  },

  execute: async ({ api, message, manager, parsedMessage }) => {
    const suffix = parsedMessage.commandName === "bank";
    const senderID = message.senderID;
    const mentions = message.mentions;

    try {
      const targetID = mentions && Object.keys(mentions).length ? Object.keys(mentions)[0] : senderID;

      if (mentions && targetID !== senderID && !isAdministrator(senderID)) {
        return api.sendMessage("🚫 Bạn không có quyền xem ngân hàng của người khác!", message.threadID);
      }

      const user = await manager.users.getUserByID(targetID);
      if (isUserError(user)) {
        return api.sendMessage("❌ Không tìm thấy người dùng!", message.threadID);
      }

      const res = await getBank({ id: targetID, img: true, suffix }, "stream");
      api.sendMessage({ attachment: [res], avoid: { delay: false } }, message.threadID);
    } catch (error) {
      console.error("❌ Lỗi khi lấy thông tin ngân hàng:", error);
      api.sendMessage("🚫 Có lỗi xảy ra khi lấy thông tin ngân hàng, thử lại sau!", message.threadID);
    }
  }
} satisfies import("../types").BotCommand;
