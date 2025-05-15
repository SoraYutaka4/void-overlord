import Jimp from "jimp";
import axios from "axios";
import fs from "fs";
import path from "path";
import { transformTextWithStyle } from "../utils/styledFont"

function removeDiacritics(input: string): string {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function createImage(avt1: string, avt2: string, bgPath: string, outputPath: string, name1: string, name2: string, percent: number) {
    try {
      const res1 = await axios.get(avt1, { responseType: 'arraybuffer' });
      const res2 = await axios.get(avt2, { responseType: 'arraybuffer' });
  
      const image1 = await Jimp.read(Buffer.from(res1.data));
      const image2 = await Jimp.read(Buffer.from(res2.data));
  
      const avatarSize = 400;
      image1.resize(avatarSize, avatarSize);
      image2.resize(avatarSize, avatarSize);
  
      const createCircleMask = async (size: number) => {
        const mask = new Jimp(size, size, 0x00000000); 
        mask.scan(0, 0, size, size, (x, y) => {
          const dx = x - size / 2;
          const dy = y - size / 2;
          if (dx * dx + dy * dy <= (size / 2) * (size / 2)) {
            mask.setPixelColor(0xFFFFFFFF, x, y); 
          }
        });
        return mask;
      };
  
      const circleMask = await createCircleMask(avatarSize);
  
      image1.mask(circleMask.clone(), 0, 0);
      image2.mask(circleMask.clone(), 0, 0);
  
      const bg = await Jimp.read(bgPath);
      const bgHeight = bg.getHeight();
      const font = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
      const font2 = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
  
      bg.composite(image1, 300, (bgHeight - avatarSize) / 2);
      bg.composite(image2, 1150, (bgHeight - avatarSize) / 2);
  
      bg.print(font, 300, 175, {
        text: name1.length > 17 ? name1.slice(0, 15) + "..." : name1,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
      }, avatarSize, 40);
  
      bg.print(font, 1150, 175, {
        text: name2.length > 17 ? name2.slice(0, 15) + "..." : name2,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
      }, avatarSize, 40);

      bg.print(font2, (1150 - 300 + 27.5) / 1.2 , (bgHeight - 28 ) / 2, {
        text: `${percent}%`,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
      }, avatarSize, 40);

  
      await bg.writeAsync(outputPath);
      return outputPath;
  
    } catch (err) {
      console.error("⚠️ Lỗi khi tạo ảnh:", err);
      throw err;
    }
  }

  export default {
    info: {
      name: "-ghepdoi",
      description: "Ghép đôi ngẫu nhiên ❤",
      version: "1.0.0",
      prefix: false,
      cooldown: 10,
      aliases: ['ghepdoi'],
      category: ["Fun"],
      credits: "NPK31",
      freeUse: true
    },
  
    execute: async ({api, message, manager}) =>{
      try {
        const threadInfo = await api.getThreadInfo(message.threadID);
        const botId = api.getCurrentUserID();
        const memberIds = threadInfo.participantIDs.filter(id => id !== botId);

        if (memberIds.length < 2) {
            return api.sendMessage("❌ Cần ít nhất 2 người trong nhóm để ghép đôi!", message.threadID);
        }

        const randomIndex1 = Math.floor(Math.random() * memberIds.length);
        let randomIndex2 = Math.floor(Math.random() * memberIds.length);

        while (randomIndex2 === randomIndex1) {
            randomIndex2 = Math.floor(Math.random() * memberIds.length);
        }

        const member1Id = memberIds[randomIndex1];
        const member2Id = memberIds[randomIndex2];

        const users = threadInfo.userInfo.filter(user => user.id === member1Id || user.id === member2Id);

        if (!users) {
            return api.sendMessage("❌ Không thể lấy thông tin người dùng!", message.threadID);
        }

        const userInfo1 = users.find(user => user.id === member1Id);
        const userInfo2 = users.find(user => user.id === member2Id);

        if (!userInfo1 || !userInfo2) {
            console.log(users);
            return api.sendMessage("❌ Không thể lấy thông tin người dùng!", message.threadID);
        }

        const avtar1 = `https://graph.facebook.com/${member1Id}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avtar2 = `https://graph.facebook.com/${member2Id}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const name1 = userInfo1.name;
        const name2 = userInfo2.name;
  
        const percent = Math.floor(Math.random() * 100) + 1;
  
        const mung = [
          "Trách phận vô duyên...",
          "Hơi thấp nhưng không sao. Hãy cố gắng lên!",
          "3 phần duyên nợ, 7 phần cố gắng",
          "Tỷ lệ mà mối quan hệ này có thể nên duyên cũng khá là nhỏ đấy! Phải cố gắng hơn nữa",
          "Date với nhau đi. Để mối quan hệ này có thể tiến xa hơn",
          "Hãy chủ động bắt chuyện hơn nữa. Hai bạn khá là hợp đôi",
          "Hãy tin vào duyên số đi, vì nó có thật đấy!",
          "Hợp đôi lắm đấy. Quan tâm chăm sóc cho mối quan hệ này nhiều hơn nữa nhé!",
          "Lưu số nhau đi, bao giờ cưới thì gọi nhau lên lễ đường!",
          "Chúc 2 bạn hạnh phúc",
          "Chúc 2 bạn trăm năm hạnh phúc",
          "Chúc 2 bạn xây dựng được 1 tổ ấm hạnh phúc",
          "Chúc 2 bạn cùng nhau nương tựa đến cuối đời",
          "Cưới đi chờ chi!"
        ];
  
        let chuc: string;
        if (percent < 20) chuc = mung[0];
        else if (percent < 30) chuc = mung[1];
        else if (percent < 40) chuc = mung[2];
        else if (percent < 50) chuc = mung[3];
        else if (percent < 60) chuc = mung[4];
        else if (percent < 70) chuc = mung[5];
        else if (percent < 80) chuc = mung[6];
        else if (percent < 85) chuc = mung[7];
        else if (percent < 90) chuc = mung[8];
        else if (percent < 93) chuc = mung[9];
        else if (percent < 95) chuc = mung[10];
        else if (percent < 97) chuc = mung[11];
        else if (percent < 99) chuc = mung[12];
        else chuc = mung[13];
  
        const outputPath = path.join(manager.publicPath, "dist", `ghep-${Date.now()}.jpg`);
        const bgPath = path.join(manager.publicPath, "img", "love_bg.jpg");
  
        await createImage(avtar1, avtar2, bgPath, outputPath, removeDiacritics(name1), removeDiacritics(name2), percent);
  
        // const arraytag = [
        //   { id: member1Id, tag: "@" + name1 },
        //   { id: member2Id, tag: "@" + name2 }
        // ];
  
        const heart = "💗";
        const sparkle = "✨";
        const stars = "🌟";
        const padX = "𓍼".repeat(1);
        
        const msg = {
          body: `${padX}「 ${sparkle}✦ ${transformTextWithStyle("Ghép đôi thành công", "boldSerif")} ✦${sparkle} 」${padX}\n` +
                `💌 ${transformTextWithStyle("Lời chúc", "boldItalicSerif")}: ${chuc}\n` +
                `❤️‍🔥 Tỉ lệ hợp đôi: ${percent}%\n` +
                `${stars} ${name1} ${heart} ${name2} ${stars}`,
          attachment: [fs.createReadStream(outputPath)]
        };
  
        api.sendMessage({
            ...msg,
            avoid: {
                delay: false
            }
        }, message.threadID, () => fs.unlinkSync(outputPath));
        
      } catch (error) {
        console.error("Error in ghep command:", error);
        return api.sendMessage("⚠️ Đã xảy ra lỗi khi lấy thông tin người dùng.", message.threadID);
      }
    },
  } satisfies import("../types").BotCommand;