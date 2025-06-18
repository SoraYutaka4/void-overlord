import { addAdministrator, removeAdministrator, getAdminList } from "../utils";

export default {
  info: {
    name: "admin",
    description: "Thêm, xoá hoặc xem danh sách admin",
    version: "1.0.0",
    prefix: true,
    hidden: true,
    permission: "admin",
    usage: "➤ Thêm admin: admin add [ID hoặc mention]\n➤ Xoá admin: admin remove [ID hoặc mention]\n➤ Xem danh sách: admin list",
    example: "admin add 123456789\nadmin add @user\nadmin remove 123456789\nadmin list",
    aliases: ["ad"],
    category: "Admin",
    credits: "NPK31",
  },

  execute: async ({api, message, parsedMessage}) =>{
    try {
      const subCommand = parsedMessage.args[1];

      const mentions = message.mentions;
      const mentionedID = mentions && Object.keys(mentions).length > 0
        ? Object.keys(mentions)[0]
        : null;

      const targetID = mentionedID || parsedMessage.args[2];

      if (["add", "remove"].includes(subCommand)) {
        if (!targetID) {
          return api.sendMessage("❌ Bạn cần nhập ID hoặc mention để thực hiện thao tác.", message.threadID);
        }

        if (!mentionedID && !/^\d+$/.test(targetID)) {
          return api.sendMessage("❗ ID không hợp lệ. Vui lòng nhập đúng ID số hoặc mention người dùng.", message.threadID);
        }
      }

      if (subCommand === "add") {
        const success = addAdministrator(targetID);
        return api.sendMessage(
          success ? `✅ Đã thêm admin với ID: ${targetID}` : `⚠️ ID ${targetID} đã là admin rồi.`,
          message.threadID
        );
      }

      if (subCommand === "remove") {
        const success = removeAdministrator(targetID);
        return api.sendMessage(
          success ? `✅ Đã xoá admin với ID: ${targetID}` : `⚠️ Không tìm thấy admin với ID: ${targetID}.`,
          message.threadID
        );
      }

      if (subCommand === "list") {
        const list = getAdminList();
        return api.sendMessage(
          list.length > 0 ? `📜 Danh sách admin:\n${list.join("\n")}` : "⚠️ Hiện chưa có admin nào.",
          message.threadID
        );
      }

      return api.sendMessage(
        "❌ Sai cú pháp!\n" +
        "➤ Thêm admin: admin add [ID hoặc mention]\n" +
        "➤ Xoá admin: admin remove [ID hoặc mention]\n" +
        "➤ Xem danh sách: admin list",
        message.threadID
      );
    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Đã có lỗi xảy ra khi xử lý lệnh admin.", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
