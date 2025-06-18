import { BotCommand } from "../types";
import { addOwnerPermission, removeOwnerPermission, getOwnerPermissions } from "../utils/command";

const command: BotCommand = {
    info: {
        name: "owner",
        description: "Quản lý quyền owner cho người dùng cụ thể.",
        version: "1.0.0",
        prefix: true,
        hidden: true,
        aliases: ["sohuu", "quyen"],
        permission: "admin",
        usage: "owner grant|revoke|view <uid> [command]",
        example: [
          "owner grant 123456789 kick",
          "owner revoke 987654321 ban",
          "owner view 123456789"
        ],
        category: "Admin",
        credits: "NPK31"
    },      

  execute: async ({api, message, parsedMessage}) =>{
    const [, action, id, commandName] = parsedMessage.args;
    
    const mentionedUsers = message.mentions ? Object.keys(message.mentions)[0] : null;
    const uid = (/\@/.test(id) ? mentionedUsers : id) ?? message.senderID;

    if (!action) return;

    if (!uid) {
      return api.sendMessage("❗ UID không hợp lệ.", message.threadID);
    }

    const finalCommandName = commandName ?? (parsedMessage.args[2]);

    switch (action) {
      case "grant": {
        if (!finalCommandName) {
          return api.sendMessage("❗ Thiếu tên lệnh để cấp quyền.", message.threadID);
        }

        const ok = addOwnerPermission(uid, finalCommandName);
        return api.sendMessage(ok
          ? `✅ Đã cấp quyền ${finalCommandName} cho UID ${uid}.`
          : `❌ Lỗi khi cấp quyền.`, message.threadID);
      }

      case "revoke": {
        if (!finalCommandName) {
          return api.sendMessage("❗ Thiếu tên lệnh để thu hồi quyền.", message.threadID);
        }

        const ok = removeOwnerPermission(uid, finalCommandName);
        return api.sendMessage(ok
          ? `✅ Đã thu hồi quyền ${finalCommandName} khỏi UID ${uid}.`
          : `❌ Lỗi khi thu hồi quyền.`, message.threadID);
      }

      case "view": {
        const permissions = getOwnerPermissions(uid);
        if (!permissions) {
          return api.sendMessage(`UID ${uid} không có quyền owner nào.`, message.threadID);
        }

        return api.sendMessage(`📋 UID ${uid} có quyền với các lệnh:\n- ${permissions.join("\n- ")}`, message.threadID);
      }

    }
  },
};

export default command;
