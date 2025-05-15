import { addToBlacklist, removeFromBlacklist, getBlacklist } from "../utils";

export default {
  info: {
    name: "blacklist",
    description: "Thêm, xoá hoặc xem blacklist người dùng / thread",
    version: "1.0.0",
    prefix: true,
    hidden: true,
    permission: "admin",
    usage:
      "➤ Thêm user: blacklist user add [ID/@mention]\n" +
      "➤ Xoá user: blacklist user remove [ID/@mention]\n" +
      "➤ Thêm thread: blacklist thread add [ID]\n" +
      "➤ Xoá thread: blacklist thread remove [ID]\n" +
      "➤ Xem danh sách: blacklist list",
    example:
      "blacklist user add 123456789\n" +
      "blacklist user remove @user123\n" +
      "blacklist thread add 987654321\n" +
      "blacklist list",
    aliases: ["bl"],
    category: "Admin",
    credits: "NPK31"
  },

  execute: async ({api, message, parsedMessage}) =>{
    try {
      const target = parsedMessage.args[1]; // user | thread | list
      const action = parsedMessage.args[2]; // add | remove

      if (target === "list") {
        const list = getBlacklist();
        return api.sendMessage(
          `📌 Danh sách blacklist:\n👤 ID Người dùng:\n${list.users.join("\n") || "Không có"}\n\n💬 Threads:\n${list.threads.join("\n") || "Không có"}`,
          message.threadID
        );
      }

      if (!["user", "thread"].includes(target) || !["add", "remove"].includes(action)) {
        return api.sendMessage(
          "❌ Sai cú pháp!\n" +
          "➤ Thêm user: blacklist user add [ID/@mention]\n" +
          "➤ Xoá user: blacklist user remove [ID/@mention]\n" +
          "➤ Thêm thread: blacklist thread add [ID]\n" +
          "➤ Xoá thread: blacklist thread remove [ID]\n" +
          "➤ Xem danh sách: blacklist list",
          message.threadID
        );
      }

      let id = parsedMessage.args[3];

      if (target === "user") {
        if (message.mentions && Object.keys(message.mentions).length > 0) {
          id = Object.keys(message.mentions)[0];
        } else if (!/^\d+$/.test(id)) {
          return api.sendMessage(
            "❗ Bạn cần mention người dùng hoặc nhập đúng ID số.",
            message.threadID
          );
        }
      }

      if (target === "thread" && (!id || !/^\d+$/.test(id))) {
        return api.sendMessage("❗ Bạn cần nhập đúng ID thread (số).", message.threadID);
      }

      if (action === "add") {
        const success = addToBlacklist(target === "user" ? "users" : "threads", id);
        return api.sendMessage(
          success
            ? `✅ Đã thêm ${target} với ID: ${id} vào blacklist.`
            : `⚠️ ${target} với ID ${id} đã có trong blacklist.`,
          message.threadID
        );
      }

      if (action === "remove") {
        const success = removeFromBlacklist(target === "user" ? "users" : "threads", id);
        return api.sendMessage(
          success
            ? `✅ Đã xoá ${target} với ID: ${id} khỏi blacklist.`
            : `⚠️ Không tìm thấy ${target} với ID: ${id} trong blacklist.`,
          message.threadID
        );
      }
    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Đã có lỗi xảy ra khi xử lý lệnh blacklist.", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
