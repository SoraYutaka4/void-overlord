import { transformTextWithStyle } from "../utils/styledFont";
import { isActive } from "../utils/command";
import config from "../../../config.json";
import fs from "fs";
import path from "path";

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${days}d : ${hours}h : ${minutes}m : ${secs}s`;
};

export default {
  info: {
    name: "info",
    description: "Thông tin của tôi",
    version: "1.1.0",
    prefix: true,
    offline: true,
    category: "Info",
    credits: "NPK31",
    aliases: ["in4"]
  },

  execute: ({api, message, manager, styleText}) =>{
  try {
      const uptime = process.uptime();
      const botStatus = isActive() ? " Đang hoạt động ✅" : " Đã tắt ❌";

      const separatorLength = 26;
      const categoryLength = "Thông tin model".length;
      const sideLength = Math.max((separatorLength - 2 - categoryLength) / 2, 0);
      const separator = `ミ★${"=".repeat(sideLength)}${transformTextWithStyle("Thông tin model", "handwrittenBold")}${"=".repeat(sideLength)}★彡`;

      const tt = (str: string) => styleText(str, "boldSansSerif");

      const content = `${separator}

${tt("🚀 Model:")} ${config.name.vi}
${tt("👨‍💻 Người tạo:")} ${config.creator}
${tt("🔄 Phiên bản:")} ${config.version}
${tt("⏰ Uptime:")} ${formatUptime(uptime)}
${tt("📝 Số lệnh đang hoạt động:")} ${manager.commandCount - 1}
${tt("💬 Tin nhắn đã xử lý:")} ${manager.messageCount}
${tt("⚡ Trạng thái:")} ${botStatus}`;

      api.sendMessage({
        body: content,
        attachment: [fs.createReadStream(path.join(manager.publicPath, "gif/esdeath", `g${Math.floor(Math.random() * 2) + 1}.gif`))],
        avoid: {
          obfuscate: false,
          emoji: false
        }
      }, message.threadID);
    } catch (err){
      console.error(err);
    }
  },
} satisfies import("../types").BotCommand;
