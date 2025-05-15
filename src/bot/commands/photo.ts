import fs from "fs/promises";
import path from "path";
import axios from "axios";

const loadJson = async (fileName: string): Promise<string[]> => {
  const filePath = path.join(__dirname, "data", fileName);
  const fileContent = await fs.readFile(filePath, "utf-8");
  return JSON.parse(fileContent);
};

const getRandomImageStream = async (urls: string[], retries = 5): Promise<NodeJS.ReadableStream | null> => {
  if (retries <= 0 || urls.length === 0) return null;

  const randomUrl = urls[Math.floor(Math.random() * urls.length)];

  try {
    const response = await axios.get(randomUrl, { responseType: "stream" });
    return response.data;
  } catch (error) {
    console.warn(`❌ Không tải được ảnh từ ${randomUrl}, thử lại... (${retries - 1} lần còn lại)`);
    return getRandomImageStream(urls, retries - 1);
  }
};

export default {
  info: {
    name: "anh",
    description: "Xem ảnh không giới hạn 😈",
    version: "1.1.0",
    prefix: true,
    aliases: ["ảnh", "photo"],
    category: ["Fun"],
    credits: "NPK31"
  },

  execute: async ({api, message, parsedMessage, normalizeText}) => {
    const args = parsedMessage.args;
    const method = normalizeText(args[1]?.toLowerCase() ?? "");

    if (!method) {
      return api.sendMessage(
        "📸 Bạn muốn xem ảnh gì nè? Dưới đây là một số gợi ý bạn có thể dùng:\n" +
        " - anime: Xem ảnh anime đẹp.\n" +
        " - loli: Xem ảnh dễ thương.\n" +
        " - gura: Xem ảnh Gura.\n" +
        "Hãy thử một trong những thể loại này nhé!",
        message.threadID
      );
    }

    let imageUrls: string[] = [];

    try {
      switch (method) {
        case "anime":
        case "wibu":
          imageUrls = await loadJson("anime.json");
          break;
        case "loli":
          imageUrls = await loadJson("loli.json");
          break;
        case "ass":
        case "mong":
          imageUrls = await loadJson("beauty.json");
          break;
        case "gura":
          imageUrls = await loadJson("gura.json");
          break;
        case "breast":
        case "nguc": 
          imageUrls = await loadJson("beauty2.json");
          break;
        default:
          return api.sendMessage("❓ Ảnh bạn yêu cầu không tồn tại. Thử anh anime nha!", message.threadID);
      }
    } catch (err) {
      console.error("🚨 Lỗi khi đọc file JSON:", err);
      return api.sendMessage("🛠 Có lỗi xảy ra khi đọc dữ liệu ảnh, thử lại sau nha!", message.threadID);
    }

    const imageStream = await getRandomImageStream(imageUrls);

    if (!imageStream) {
      return api.sendMessage("🥲 Hỏng tải được ảnh nào hết. Có thể nguồn bị lỗi, thử lại sau nha!", message.threadID);
    }

    return api.sendMessage({
      attachment: [imageStream],
    }, message.threadID);
  },
} satisfies import("../types").BotCommand;
