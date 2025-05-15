import Jimp from "jimp";
import path from "path";
import fs from "fs";
import { transformTextWithStyle as TT } from "../utils";
import { New_Message } from "../types"


async function createImage(
  list: Record<string, number>,
  publicSrc: string,
  outputSrc: string,
  page: number,
) {
  const imgSrc = path.join(publicSrc, "template_lb1");
  const fontSrc = path.join(publicSrc, "font");

  const p = (name: string, src?: string) => path.join(src ?? imgSrc, name);
  const gRowPath = (star: number) => p(`${star}s.png`);

  const leaderboardImage = await Jimp.read(p("bg1_v2.png"));
  const [font1, font2, font3] = await Promise.all([
    Jimp.loadFont(p("BlowBrush_42_Bold.fnt", fontSrc)),
    Jimp.loadFont(p("BlowBrush_32_Bold.fnt", fontSrc)),
    Jimp.loadFont(p("BlowBrush_54_Bold.fnt", fontSrc)),
  ]);

  const baseY = 100;
  const gapY = 100;

  const entries = Object.entries(list)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  for (let i = 0; i < entries.length; i++) {
    const [name, count] = entries[i];
    const stars = Math.floor(count / 15) + 1;
    const cappedStars = Math.min(Math.max(stars, 1), 5);

    const [starImg, profileImg] = await Promise.all([
      Jimp.read(gRowPath(cappedStars)),
      new Jimp(75, 54, 0xFFFFFFFF),
    ]);

    const starWrapper = new Jimp(starImg.bitmap.width, starImg.bitmap.height, 0x00000000);
    starWrapper.composite(profileImg, 95, 15);
    starWrapper.composite(starImg, 0, 0);

    const posY = baseY + i * gapY;
    leaderboardImage.composite(starWrapper, 85, posY);

    const index = i + 1 + (page - 1) * 5;
    const nameDisplay = name.length > 20 ? name.slice(0, 17) + "..." : name;
    const countDisplay = count.toLocaleString().padStart(3, " ");
    const smallFont = count < 1000;

    const indexFont = index < 100 ? font3 : font1;
    leaderboardImage.print(indexFont, 30, posY + 17.5, index.toString().padStart(2, " "));

    leaderboardImage.print(font2, 335, posY + 32.5, nameDisplay);
    leaderboardImage.print(
      smallFont ? font1 : font2,
      smallFont ? 905 : 895,
      posY + (smallFont ? 20 : 25),
      countDisplay
    );
  }

  await leaderboardImage.writeAsync(outputSrc);
  // console.log("✅ Created leaderboard image at:", outputSrc);

  return outputSrc;
}

export default {
    info: {
      name: "-tuongtacbot",
      description: "Xem top người tương tác nhiều nhất với BOT",
      version: "1.0.0",
      prefix: false,
      category: "Info",
      credits: "NPK31",
      usage: "tuongtacbot <số trang>",
      example: "tuongtacbot 1",
      aliases: ["tương tác bot", "top tương tác bot", "top tuong tac bot", "tuong tac bot"],
    },
  
    execute: async ({api, message, manager, parsedMessage, normalizeText}) =>{
      const send = (msg: string | New_Message) =>
        api.sendMessage(typeof msg === "string" ? msg : { ...msg }, message.threadID);

      const args = parsedMessage.args;
      const page = parseInt(args[1]) || 1;

      const currentIndex = (page - 1) * 5
      const list = Array.from(manager.interactionsCount.entries());
      const top = list
        .sort((a, b) => b[1] - a[1])
        .slice(currentIndex, currentIndex + 5);

          
      if (isNaN(page) || page < 1) return send(`❌ Số trang không hợp lệ!`);
      if (top.length === 0) return send("😅 Dường như không có ai xếp hạng ở trang này.");
    

      const resultObj = top.reduce((acc: Record<string, { count: number }>, [key, count]) => {
        const [name] = key.split(":");

            acc[normalizeText(name)] = {
                count
            };
        return acc;
      }, {});

      const outPath = path.join(manager.publicPath, "dist", "LB_BI.png");
      const countOnlyObj = Object.fromEntries(
        Object.entries(resultObj).map(([key, value]) => [key, value.count])
      );
      await createImage(countOnlyObj, manager.publicPath, outPath, page);
    
      const maxPage = Math.floor(list.length / 5) + 1;

      return send({
        body: `🏆⏤͟͟͞͞★${TT(`Bảng xếp hạng tương tác với ${TT("BOT", "boldSansSerif")} (${page}/${maxPage})`, "italicSerif")}`,
        attachment: [fs.createReadStream(outPath)]
      });
    },
    
  } satisfies import("../types").BotCommand;
  