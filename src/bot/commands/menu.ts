import path from "path";
import fs from "fs";

export default {
  info: {
    name: "menu",
    description: "Danh sách lệnh",
    version: "1.0.0",
    prefix: true,
    usage: "menu <số_trang>",
    example: "menu 1\nmenu 2",
    category: "Info",
    credits: "NPK31"
  },

  execute: ({api, message, manager, parsedMessage}) =>{
    const numPage = Number(parsedMessage.args[1]);
    const totalPages = Math.ceil(manager.commandCount / 10); 

    if (!Number.isInteger(numPage) || numPage < 1 || numPage > totalPages) {
      return api.sendMessage(`❌ Trang không hợp lệ! Vui lòng nhập một số nguyên từ 1 đến ${totalPages}.`, message.threadID);
    }

    const filePath = path.resolve(__dirname, "..", "..", "public", "dist", `menu_page${numPage}.png`);

    if (!fs.existsSync(filePath)) {
      return api.sendMessage(`❌ Không tìm thấy ảnh cho trang ${numPage}.`, message.threadID);
    }

    api.sendMessage({
      attachment: [fs.createReadStream(filePath)]
    }, message.threadID);
  },
} satisfies import("../types").BotCommand;
