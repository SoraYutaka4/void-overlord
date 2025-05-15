import path from "path";
import fs from "fs";
import { readInjectedCommands, removeInjectedCommand } from "../utils/command";
import { reloadModule } from "../utils/cache"; 

const normalize = (s: string) => s.normalize("NFKC");

export default {
  info: {
    name: "uninject",
    description: "Xóa lệnh đã nạp 🤫",
    version: "1.1.0",
    prefix: true,
    hidden: true,
    permission: "admin",
    category: "Admin",
    credits: "NPK31"
  },

  execute: async ({api, message, manager, parsedMessage}) =>{
    try {
      const name = normalize(parsedMessage.args[1].toLowerCase().trim());
      if (!name) {
        return api.sendMessage("⚠️ Thiếu tên lệnh. Cú pháp đúng: `uninject <tên-lệnh>`", message.threadID);
      }

      const data = readInjectedCommands();
      if (!data) {
        return api.sendMessage("💥 Đã có lỗi xảy ra khi đọc lệnh. Vui lòng thử lại.", message.threadID);
      }

      const cmdPath = data.find((item) =>
        normalize(path.basename(path.dirname(item))).toLowerCase() === normalize(name).toLowerCase()
      );

      if (!cmdPath) {
        return api.sendMessage(`❌ Không tìm thấy module ${name} để xóa. Kiểm tra lại tên lệnh thử nhé.`, message.threadID);
      }
      
      const module = await reloadModule(cmdPath, {
        log: {
          debug: false,
          info: ["loaded"],
        }
      });

      if (!module || !module.default || !module.default.info) {
        return api.sendMessage("❌ Không thể tải lại module này để xóa. Có thể đã bị lỗi hoặc hỏng.", message.threadID);
      }
      
      const info = module.default.info;
      const rawName = Array.isArray(info.name) ? info.name.at(-1) : info.name;
      if (!rawName) return;

      const cmdName = rawName.replace(/^[!./~-]/, ""); 

      if (!cmdName) {
        return api.sendMessage("❌ Không thể xác định tên lệnh từ module này. Có thể module đã bị hỏng hoặc thiếu thông tin.", message.threadID);
      }

      const cmdIndex = manager.commands.findIndex((cmd) => {
        const nameToCompare = Array.isArray(cmd.name) ? cmd.name.at(-1) : cmd.name;
        const strippedName = nameToCompare?.replace(/^[!./~-]/, "");
        return strippedName === cmdName;
      });

      if (cmdIndex === -1) {
        return api.sendMessage(`❌ Không tìm thấy lệnh ${name} trong danh sách lệnh.`, message.threadID);
      }

      const cmdDir = path.dirname(cmdPath);
      
      fs.rmSync(cmdDir, { recursive: true, force: true });
      removeInjectedCommand(cmdPath);
      
      manager.commands.splice(cmdIndex, 1);
      api.sendMessage(`✅ Lệnh ${name} đã được xóa thành công!`, message.threadID);

    } catch (error) {
      console.error("Lỗi khi xóa lệnh:", error);
      api.sendMessage("💥 Oops, có gì đó sai sai khi xóa lệnh. Thử lại sau nhé.", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
