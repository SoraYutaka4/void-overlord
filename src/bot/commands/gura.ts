import path from "path";
import fs from "fs/promises";
import axios from "axios";

export default {
  info: {
    name: "gura",
    description: "Xem ảnh Gawr Gura",
    version: "1.0.0",
    prefix: true,
    category: "Fun",
  },

  execute: async ({ api, message }) => {
    try {
      const filePath = path.join(__dirname, "data", "gura.json");
      const content = await fs.readFile(filePath, "utf-8");
      const urls: string[] = JSON.parse(content);

      let imageStream: NodeJS.ReadableStream | null = null;
      let retries = 5;

      while (retries-- > 0 && !imageStream) {
        const url = urls[Math.floor(Math.random() * urls.length)];
        try {
          const res = await axios.get(url, { responseType: "stream" });
          imageStream = res.data;
        } catch {
          console.warn(`❌ Không tải được ảnh từ ${url}, thử lại (${retries} lần còn lại)`);
        }
      }

      if (!imageStream) {
        return api.sendMessage(
          "🥲 Hỏng tải được ảnh nào hết. Có thể nguồn bị lỗi, thử lại sau nha!",
          message.threadID
        );
      }

      return api.sendMessage({ attachment: [imageStream] }, message.threadID);
    } catch (err) {
      console.error("❌ Lỗi trong lệnh gura:", err);
      return api.sendMessage("⚠️ Đã có lỗi xảy ra, thử lại sau nhé!", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
