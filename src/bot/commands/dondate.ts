import { isUserError } from "../controllers/usersManager";
import { UserErrorMessages } from "../types/user";

export default {
  info: {
    name: "donate",
    description: "Donate tiền cho người khác 💰",
    version: "1.0.0",
    prefix: true,
    usage: "đonate @tag money=<số tiền>",
    example: "donate @user1 money=125",
    category: "Fun",
    credits: "NPK31"
  },

  execute: async ({api, message, manager, parsedMessage}) =>{
    const { threadID, senderID, mentions } = message;
    const args = parsedMessage.args
    const money = parseInt(args[args.length - 1]) || parseInt(parsedMessage.query.money);

    if (isNaN(money)) {
      return api.sendMessage("💸 Số tiền donate không hợp lệ.\n📝 Nhập: donate @user money=<số tiền>", threadID);
    }

    if (money <= 0) {
      return api.sendMessage("💸 Số tiền donate phải lớn hơn 0 nghen.", threadID);
    }

    const receiverEntries = Object.entries(mentions);
    if (receiverEntries.length === 0) {
      return api.sendMessage("📥 Nhớ mention người muốn donate cho chứ ba!", threadID);
    }

    const [receiverID, receiverTag] = receiverEntries[0];
    const receiverName = receiverTag.replace(/@/g, "");

    if (receiverID === senderID) {
      return api.sendMessage("😅 Tự donate cho mình chi dzậy?", threadID);
    }

    try {
      const senderUser = await manager.users.getUserByID(senderID, true);
      if (isUserError(senderUser)) {
        return api.sendMessage(UserErrorMessages.vi[senderUser], threadID);
      }
      if (senderUser.balance < money) {
        return api.sendMessage("💸 Bạn không đủ tiền để donate đâu!", threadID);
      }

      const receiverUser = await manager.users.getUserByID(receiverID);
      if (!receiverUser) {
        return api.sendMessage("❌ Không tìm thấy người nhận.", threadID);
      }

      const updateSender = await manager.users.updateUser(senderID, "balance", -money);
      if (isUserError(updateSender)) {
        return api.sendMessage(UserErrorMessages.vi[updateSender], threadID);
      }

      const updateReceiver = await manager.users.updateUser(receiverID, "balance", money);
      if (isUserError(updateReceiver)) {
        await manager.users.updateUser(senderID, "balance", money); // rollback
        return api.sendMessage(UserErrorMessages.vi[updateReceiver], threadID);
      }

      api.sendMessage(
        `✅ Bạn đã donate $${money.toLocaleString()}💰 cho **${receiverName.slice(0, 16)}** thành công!`,
        threadID
      );
      

    } catch (err) {
      console.error("❌ Error in donate command:", err);
      api.sendMessage("❌ Có lỗi xảy ra khi donate. Đợi tí rồi thử lại nhé!", threadID);
    }
  },
} satisfies import("../types").BotCommand;
