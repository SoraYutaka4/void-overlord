import si from "systeminformation";
import { transformTextWithStyle } from "../utils/styledFont";

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${days}d : ${hours}h : ${minutes}m : ${secs}s`;
};

const formatBytes = (bytes: number): string => {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export default {
  info: {
    name: "system",
    description: "Thông tin phần cứng",
    version: "1.1.1",
    prefix: true,
    offline: true,
    category: "Info",
    aliases: ["hardware", "hw", "phancung"],
    credits: "NPK31"
  },

  execute: async ({api, message, styleText}) => {
    const [osInfo, cpuInfo, memInfo, loadInfo, graphicsInfo, timeInfo] = await Promise.all([
      si.osInfo(),
      si.cpu(),
      si.mem(),
      si.currentLoad(),
      si.graphics(),
      si.time()
    ]);

    const separatorLength = 24;
    const categoryText = "Thông tin phần cứng";
    const sideLength = Math.max((separatorLength - 2 - categoryText.length) / 2, 0);
    const separator = `ミ★${"=".repeat(sideLength)}${transformTextWithStyle(categoryText, "handwrittenBold")}${"=".repeat(sideLength)}★彡`;

    const tt = (str: string) => styleText(str, "boldSansSerif");

    const mainGPU = graphicsInfo.controllers.length > 0 ? graphicsInfo.controllers[0].model : "None";

    const load1min = loadInfo.avgLoad.toFixed(2);

    const content = `
${separator}

${tt("🌐 Hệ điều hành:")} ${osInfo.distro} ${osInfo.release} (${osInfo.arch})
${tt("🧠 CPU:")} ${cpuInfo.manufacturer} ${cpuInfo.brand} (${cpuInfo.speed} GHz)
${tt("🎮 GPU:")} ${mainGPU}
${tt("⚙️ Số lõi CPU:")} ${cpuInfo.cores} (Threads: ${cpuInfo.physicalCores})
${tt("📈 CPU đang dùng:")} ${loadInfo.currentLoad.toFixed(2)}%
${tt("📊 Load trung bình (1 phút):")} ${load1min}

${tt("🔋 Tổng RAM:")} ${(memInfo.total / 1024 / 1024 / 1024).toFixed(2)} GB
${tt("💾 RAM trống:")} ${(memInfo.available / 1024 / 1024 / 1024).toFixed(2)} GB
${tt("🧮 RAM đang dùng:")} ${formatBytes(memInfo.active)}

${tt("🖥️ Uptime máy chủ:")} ${formatUptime(timeInfo.uptime)}

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

