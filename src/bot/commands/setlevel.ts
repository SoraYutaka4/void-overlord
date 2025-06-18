import { isUserError } from "../controllers/usersManager";
import { UserErrorMessages } from "../types/user";

export default {
    info: {
        name: "setlevel",
        description: "Tùy biến level người dùng theo ý bạn muốn.",
        version: "1.0.0",
        prefix: true,
        hidden: true,
        permission: "admin",
        category: "Admin",
        usage: "level <add|set|reset> <self|@user> <level>",
        example: [
          "level add self 3",
          "level set @Nguyễn Văn A 10",
          "level reset @Nguyễn Văn A"
        ],
        credits: "NPK31"
    },

  execute: async ({api, message, manager, parsedMessage}) =>{
    const args = parsedMessage.args;
    const method = args[1];
    if (!["add", "set", "reset"].includes(method)) {
      return api.sendMessage("❓ Dùng lệnh:\n => setlevel <add|set|reset> <self|@user> <level>", message.threadID);
    }
    
    const mentions = message.mentions ?? {};
    const mentionedEntry = Object.entries(mentions)[0];
    
    const isSelf = args[2] === "self";
    const uid = isSelf ? message.senderID : mentionedEntry?.[0];
    const rawName = isSelf ? "bạn" : mentionedEntry?.[1] || args.slice(2, -1).join(" ");
    const cleanName = rawName.replace(/@/g, "").replace(/\s+/g, " ").trim();
    const name = cleanName || "người dùng";
    const amount = parseInt(args[args.length - 1]);
    
    if (!uid) {
      return api.sendMessage("❗ Vui lòng tag người nhận hoặc dùng `self`.", message.threadID);
    }

    try {
      if (!isSelf) {
        const user = await manager.users.getUserByID(uid);
        if (isUserError(user)) return api.sendMessage("❌ Không tìm thấy người dùng!", message.threadID);
      }

      switch (method) {
        case "add":
          if (isNaN(amount)) return api.sendMessage("❌ Level không hợp lệ.", message.threadID);

          const addResult = await manager.users.updateUser(uid, "level", amount);
          if (isUserError(addResult)) return api.sendMessage(UserErrorMessages.vi[addResult], message.threadID);

          return api.sendMessage(`✅ Đã cộng ${amount.toLocaleString()} level cho ${name}.`, message.threadID);

        case "set":
          if (isNaN(amount)) return api.sendMessage("❌ Level không hợp lệ.", message.threadID);

          const setResult = await manager.users.updateUser(uid, "level", amount, true);
          if (isUserError(setResult)) return api.sendMessage(UserErrorMessages.vi[setResult], message.threadID);

          return api.sendMessage(`✅ Đã đặt level của ${name} thành ${amount.toLocaleString()}.`, message.threadID);

        case "reset":
          const resetResult = await manager.users.updateUser(uid, "level", 0, true);
          if (isUserError(resetResult)) return api.sendMessage(UserErrorMessages.vi[resetResult], message.threadID);

          return api.sendMessage(`✅ Đã reset level của ${name} về 0.`, message.threadID);

      }

    } catch (error) {
      console.error("Level command error:", error);
      return api.sendMessage("⚠️ Đã xảy ra lỗi khi xử lý lệnh.", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
