import os from "os";
import { execSync } from "child_process";
import { transformTextWithStyle } from "../utils/styledFont";

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${days}d : ${hours}h : ${minutes}m : ${secs}s`;
};

export default {
  info: {
    name: "system",
    description: "Thông tin phần cứng",
    version: "1.1.0",
    prefix: true,
    offline: true,
    category: "Info",
    aliases: ["hardware", "hw", "phancung"],
    credits: "NPK31"
  },

  execute: ({api, message, styleText}) =>{
    const formatBytes = (bytes: number): string => {
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      if (bytes === 0) return "0 B";
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    };

    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const totalRAM = os.totalmem();
    const freeRAM = os.freemem();
    const cpuUsagePercentage = ((cpuUsage.user + cpuUsage.system) / 1e6).toFixed(2);

    const osVersion = execSync('wmic os get Caption').toString().trim();
    const cleanVersion = osVersion.split("\n").slice(1).join("").trim();
    const windowsNumber = cleanVersion.match(/Windows (\d+)/)?.[1] || "Unknown";

    const cpuModelRaw = os.cpus()[0].model;
    let cpuModel = cpuModelRaw;

    const intelMatch = cpuModelRaw.match(/Intel\(R\) Core\(TM\) i(\d+)-(\d+)([A-Z]*)/);
    if (intelMatch) {
      cpuModel = `i${intelMatch[1]}-${intelMatch[2]}${intelMatch[3]}`;
    }

    const amdMatch = cpuModelRaw.match(/AMD Ryzen (\d+ \d+\w*)/);
    if (amdMatch) {
      cpuModel = `Ryzen ${amdMatch[1]}`;
    }

    const separatorLength = 24;
    const categoryLength = "Thông tin model".length;
    const sideLength = Math.max((separatorLength - 2 - categoryLength) / 2, 0);
    const cpuSpeedGHz = (os.cpus()[0].speed / 1000).toFixed(2);
    const separator = `ミ★${"=".repeat(sideLength)}${transformTextWithStyle("Thông tin phần cứng", "handwrittenBold")}${"=".repeat(sideLength)}★彡`;

    const tt = (str: string) => styleText(str, "boldSansSerif");

    const content = `
    ${separator}
    
    ${tt("🌐 Hệ điều hành:")} Windows ${windowsNumber}
    ${tt("🧠 CPU:")} ${cpuModel} (${cpuSpeedGHz} GHz)
    ${tt("⚙️ Số lõi CPU:")} ${os.cpus().length}
    ${tt("📈 CPU đang dùng:")} ${cpuUsagePercentage}%
    ${tt("📊 Load trung bình (1 phút):")} ${cpuUsagePercentage}%
    
    ${tt("🔋 Tổng RAM:")} ${(totalRAM / 1024 / 1024 / 1024).toFixed(2)} GB
    ${tt("💾 RAM trống:")} ${(freeRAM / 1024 / 1024 / 1024).toFixed(2)} GB
    ${tt("🧮 RAM đang dùng:")} ${formatBytes(memoryUsage.rss)}
    
    ${tt("🖥️ Uptime máy chủ:")} ${formatUptime(os.uptime())}
    `;




    api.sendMessage({
      body: content,
      avoid: {
        obfuscate: false,
        emoji: false
      }
    }, message.threadID);
  },
} satisfies import("../types").BotCommand;
