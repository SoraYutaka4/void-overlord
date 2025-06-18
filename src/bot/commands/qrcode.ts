import QRCode from "qrcode";
import path from "path";
import fs from "fs";

const saveQRToFile = async (text: string, filePath: string): Promise<string> => {
  try {
    await QRCode.toFile(filePath, text, { type: "png" });
    return filePath;
  } catch (err) {
    throw new Error("Lỗi khi lưu QR vào file: " + err);
  }
};

export default {
  info: {
    name: "maqr",
    description: "Tạo mã QR từ văn bản",
    usage: "maqr <văn bản>",
    example: "maqr Hello World",
    aliases: ["qrcode", "qr"],
    credits: "NPK31",
    category: "Tool",
    version: "1.0.0",
    prefix: true,
    rules: {
        balance: 50
    }
  },

  execute: async ({api, message, manager, parsedMessage}) =>{
    const text = parsedMessage.args.slice(1).join(" ");
    if (!text) {
      return api.sendMessage("⚠️ Vui lòng nhập văn bản để tạo mã QR.", message.threadID);
    }

    try {
      const filePath = path.resolve(manager.publicPath, "dist", "qrcode.png");
      const qrPath = await saveQRToFile(text, filePath);
      return api.sendMessage(
        {
          body: "🌀 Dưới đây là mã QR của bạn:",
          attachment: [fs.createReadStream(qrPath)],
        },
        message.threadID
      );
    } catch (error) {
      console.error("❌ Lỗi khi gửi mã QR:", error);
      return api.sendMessage("❌ Không thể tạo mã QR. Vui lòng thử lại sau!", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
