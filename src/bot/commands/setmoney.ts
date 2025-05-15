import { isUserError } from "../controllers/usersManager";
import { UserErrorMessages } from "../types/user";

export default {
  info: {
    name: "setmoney",
    description: "Quản lý số dư của người dùng.",
    version: "1.0.0",
    prefix: true,
    hidden: true,
    permission: "admin",
    category: "Admin",
    usage: "money <add|set|reset> <self|@user> <số tiền>",
    example: [
      "money add self 1000",
      "money set @Nguyễn Văn A 5000",
      "money reset @Nguyễn Văn A"
    ],
    credits: "NPK31"
  },

  execute: async ({api, message, manager, parsedMessage}) =>{
    const args = parsedMessage.args;
    const method = args[1];

    if (!["add", "set", "reset"].includes(method)){
      return api.sendMessage("❓ Dùng lệnh:\n => setmoney <add|set|reset> <self|@user> <số tiền>", message.threadID);
    }

    const mentions = message.mentions ?? {};
    const mentionedEntry = Object.entries(mentions)[0];
    
    const isSelf = args[2] === "self";
    const uid = isSelf
      ? message.senderID
      : mentionedEntry?.[0];

    if (!uid) {
      return api.sendMessage("❗ Vui lòng tag người nhận hoặc dùng `self`.", message.threadID);
    }
    
    const rawName = isSelf
      ? "bạn"
      : mentionedEntry?.[1] || args.slice(2, -1).join(" "); 
    
    const cleanName = rawName
      .replace(/@/g, "")
      .replace(/\s+/g, " ")
      .trim();
    
    const name = cleanName || "người dùng";
    const amount = parseInt(args[args.length - 1]);
    
    console.log(`[Money Command] ${method} ${uid} ${amount}`);

    try {
      if (!isSelf) {
        const user = await manager.users.getUserByID(uid);
        if (isUserError(user)) return api.sendMessage("❌ Không tìm thấy người dùng!", message.threadID);
      }

      switch (method) {
        case "add":
          if (isNaN(amount)) return api.sendMessage("❌ Số tiền không hợp lệ.", message.threadID);

          const addResult = await manager.users.updateUser(uid, "balance", amount);
          if (isUserError(addResult)) return api.sendMessage(UserErrorMessages.vi[addResult], message.threadID);

          return api.sendMessage(`✅ Đã cộng ${amount.toLocaleString()} vào tài khoản của ${name}.`, message.threadID);

        case "set":
          if (isNaN(amount)) return api.sendMessage("❌ Số tiền không hợp lệ.", message.threadID);

          const setResult = await manager.users.updateUser(uid, "balance", amount, true);
          if (isUserError(setResult)) return api.sendMessage(UserErrorMessages.vi[setResult], message.threadID);

          return api.sendMessage(`✅ Đã đặt số dư của ${name} thành ${amount.toLocaleString()}.`, message.threadID);

        case "reset":
          const resetResult = await manager.users.updateUser(uid, "balance", 0, true);
          if (isUserError(resetResult)) return api.sendMessage(UserErrorMessages.vi[resetResult], message.threadID);

          return api.sendMessage(`✅ Đã reset số dư của ${name} về 0.`, message.threadID);
      }

    } catch (error) {
      console.error("Money command error:", error);
      return api.sendMessage("⚠️ Đã xảy ra lỗi khi xử lý lệnh.", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
