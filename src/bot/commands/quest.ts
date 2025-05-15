import { isUserError } from "../controllers/usersManager";
import { getPowerInfo } from "../controllers/requestToApi";
import { UserErrorMessages } from "../types/user";
import fs from "fs/promises";
import path from "path";

const questPath = path.join(__dirname, "quest/questData.json");

const loadJson = async (file: string): Promise<{ quest: { content: string; balance: number; exp?: number; atk?: number; def?: number }[] }[]> => {
  const filePath = path.join(file);
  const fileContent = await fs.readFile(filePath, "utf-8");
  return JSON.parse(fileContent);
};

export default {
  info: {
    name: "nhiemvu",
    description: "Làm nhiệm vụ tăng cấp",
    version: "1.0.0",
    prefix: true,
    aliases: ["quest"],
    category: ["Fun", "Game"],
    credits: "NPK31",
    cooldown: 3000
  },

  execute: async ({api, message, manager}) =>{
    try {
      const user = await manager.users.getUserByID(message.senderID, true);
      if (isUserError(user)) {
        return api.sendMessage(UserErrorMessages.vi[user], message.threadID);
      }

      const power = await getPowerInfo(message.senderID);
      const level = user.level;

      const quest = await loadJson(questPath);

      if (level >= quest.length) {
        return api.sendMessage("🚀 Bạn đã đạt cấp tối đa rồi đó!", message.threadID);
      }

      const currentQuest = quest[level]?.quest;

      let allComplete = true;
      const progressLines = currentQuest.map((q: { content: string; balance: number; exp?: number; atk?: number; def?: number }) => {
        let done = false;

        if ('exp' in q && typeof q.exp === 'number') done = user.exp >= q.exp;
        else if (q.balance) done = user.balance >= q.balance;
        else if (q.atk) done = power.attack >= q.atk;
        else if (q.def) done = power.defense >= q.def;

        if (!done) allComplete = false;
        return done ? `✅ ${q.content}` : `⬜ ${q.content}`;
      });

      if (!allComplete) {
        const reply = [
          `📛 Bạn chưa hoàn thành đủ nhiệm vụ để lên cấp ${level + 1}!`,
          "",
          "📋 Nhiệm vụ cần làm:",
          ...progressLines,
        ].join("\n");
        return api.sendMessage(reply, message.threadID);
      }

      await manager.users.updateUser(message.senderID, "level", 1);
      await manager.users.updateUser(message.senderID, "exp", 0);
      const reply = [
        `🎉 Chúc mừng! Bạn đã lên cấp ${level + 1} 🔥`,
        "",
        "📋 Nhiệm vụ đã hoàn thành:",
        ...progressLines,
      ].join("\n");

      return api.sendMessage(reply, message.threadID);
    } catch (error) {
      console.error("[uplevel] Error:", error);
      return api.sendMessage("⚠️ Có lỗi xảy ra khi xử lý uplevel.", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
