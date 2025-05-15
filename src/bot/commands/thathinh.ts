import path from "path";
import fs from "fs/promises";

const loadJson = async (p: string): Promise<string[]> => {
  const filePath = path.join(__dirname, p);
  const fileContent = await fs.readFile(filePath, "utf-8");
  return JSON.parse(fileContent);
};

export default {
  info: {
    name: "thathinh",
    description: "Thả thính",
    version: "1.0.0",
    prefix: true,
    category: "Fun",
    cooldown: 3000,
    aliases: ["thinh", "flirts"],
  },

  execute: async ({ api, message }) => {
    try {
      const flirts = await loadJson("data/thinh.json");
      if (!flirts || flirts.length === 0) {
        await api.sendMessage("Oops, chưa có câu thả thính nào 😥", message.threadID);
        return;
      }
      const random = flirts[Math.floor(Math.random() * flirts.length)];
      await api.sendMessage(random, message.threadID);
    } catch (error) {
      console.error("Error in thathinh command:", error);
      await api.sendMessage("Có lỗi xảy ra khi thả thính 😭", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
