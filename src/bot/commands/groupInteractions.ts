import Jimp from "jimp";
import path from "path";
import fs from "fs";
import { New_Message } from "../types";
import { transformTextWithStyle as TT } from "../utils";

type FieldInfo = {
  count: number;
  avt: string;
};

export enum ColorActionName {
  LIGHTEN = "lighten",
  BRIGHTEN = "brighten",
  DARKEN = "darken",
  DESATURATE = "desaturate",
  SATURATE = "saturate",
  GREYSCALE = "greyscale",
  SPIN = "spin",
  HUE = "hue",
  MIX = "mix",
  TINT = "tint",
  SHADE = "shade",
  XOR = "xor",
  RED = "red",
  GREEN = "green",
  BLUE = "blue",
}

const ROW_WIDTH = 925;
const ROW_HEIGHT = 85;
const BASE_Y = 100;
const GAP_Y = 100;
const ROW_X = 85;
const SHADOW_OFFSET = 7;
const INDEX_X = 120;
const NAME_X = 350;
const ICON_X = 875;

function createCircleMask(size: number): Jimp {
  const mask = new Jimp(size, size, 0x00000000);
  const r = size / 2;
  mask.scan(0, 0, size, size, (x, y) => {
    const dx = x - r;
    const dy = y - r;
    if (dx * dx + dy * dy <= r * r) {
      mask.setPixelColor(0xFFFFFFFF, x, y);
    }
  });
  return mask;
}

async function loadAssets(imgSrc: string, fontSrc: string) {
  const [leaderboardImage, font1, font2, font3, speechIcon] = await Promise.all([
    Jimp.read(path.join(imgSrc, "bg2.png")),
    Jimp.loadFont(path.join(fontSrc, "BlowBrush_42_Bold.fnt")),
    Jimp.loadFont(path.join(fontSrc, "BlowBrush_32_Bold.fnt")),
    Jimp.loadFont(path.join(fontSrc, "BlowBrush_54_Bold.fnt")),
    Jimp.read(path.join(imgSrc, "../img/speech_balon.png")),
  ]);
  speechIcon.resize(32, 32);
  return { leaderboardImage, font1, font2, font3, speechIcon };
}

async function drawAvatar(leaderboardImage: Jimp, avtUrl: string, x: number, y: number, size = 65) {
  try {
    const avatar = await Jimp.read(avtUrl);
    avatar.resize(size, size);
    const mask = createCircleMask(size);
    avatar.mask(mask, 0, 0);
    leaderboardImage.composite(avatar, x, y);
  } catch (err) {
    console.warn("⚠️ Không load được avatar:", avtUrl, err);
  }
}

async function drawRow({
  leaderboardImage,
  speechIcon,
  font1,
  font2,
  font3,
  name,
  count,
  posY,
  index,
}: {
  leaderboardImage: Jimp;
  speechIcon: Jimp;
  font1: any;
  font2: any;
  font3: any;
  name: string;
  count: number;
  posY: number;
  index: number;
}) {
  const row = new Jimp(ROW_WIDTH, ROW_HEIGHT, 0x113d68c4);
  const shadow = row.clone()
    .color([{ apply: ColorActionName.DARKEN, params: [80] }])
    .blur(5);

  leaderboardImage.composite(shadow, ROW_X + SHADOW_OFFSET, posY + SHADOW_OFFSET);
  leaderboardImage.composite(row, ROW_X, posY);

  const nameDisplay = name.length > 20 ? name.slice(0, 17) + "..." : name;
  const countDisplay = count.toLocaleString().padStart(3, " ");
  const indexStr = "#" + index.toString().padStart(2, " ");
  const getIndexFont = (idx: number) => (idx < 100 ? font3 : font1);

  leaderboardImage.print(getIndexFont(index), INDEX_X, posY + 17.5, indexStr);
  leaderboardImage.print(font2, NAME_X, posY + 30, nameDisplay);

  const iconY = posY + 26;
  leaderboardImage.composite(speechIcon.clone(), ICON_X, iconY + 4);
  leaderboardImage.print(font1, ICON_X + 38, iconY, countDisplay);
}

export async function createImage(
  list: Record<string, FieldInfo>,
  publicSrc: string,
  outputSrc: string,
  page: number,
) {
  const imgSrc = path.join(publicSrc, "template_lb1");
  const fontSrc = path.join(publicSrc, "font");

  const {
    leaderboardImage,
    font1,
    font2,
    font3,
    speechIcon
  } = await loadAssets(imgSrc, fontSrc);

  const entries = Object.entries(list)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  for (let i = 0; i < entries.length; i++) {
    const [name, info] = entries[i];
    const posY = BASE_Y + i * GAP_Y;
    const index = i + 1 + (page - 1) * 5;

    await drawRow({
      leaderboardImage,
      speechIcon,
      font1,
      font2,
      font3,
      name,
      count: info.count,
      posY,
      index,
    });

    if (info.avt) {
      const avatarX = ROW_X + 140;
      const avatarY = posY + (ROW_HEIGHT - 65) / 2;
      await drawAvatar(leaderboardImage, info.avt, avatarX, avatarY);
    }
  }

  await leaderboardImage.writeAsync(outputSrc);
  return outputSrc;
}


export default {
    info: {
      name: "-tuongtacnhom",
      description: "Xem top người tương tác nhiều nhất với nhóm",
      version: "1.0.0",
      prefix: false,
      category: "Info",
      credits: "NPK31",
      usage: "tuongtacnhom <số trang>",
      example: "tuongtacnhom 1",
      aliases: [
        "top tương tác nhóm", "tương tác nhóm", "tuong tac nhom", 
        "top tuong tac nhom", "top tương tác", "top tuong tac", 
        "tương tác box", "tuong tac box"
      ],
      freeUse: true
    },
  
    execute: async ({api, message, manager, parsedMessage, normalizeText}) =>{
      const send = (msg: string | New_Message) =>
        api.sendMessage(typeof msg === "string" ? msg : { ...msg }, message.threadID);

      const args = parsedMessage.args;
      const page = parseInt(args[args.length - 1]) || 1;

      const currentIndex = (page - 1) * 5
      const list = Array.from(manager.groupInteractionsCount.entries());
      const threadInfo = await api.getThreadInfo(message.threadID);
      const users = threadInfo.userInfo;
      
      const userIds = new Set(users.map(u => u.id));
      
      const top = Array.from(manager.groupInteractionsCount.entries())
        .filter(([key]) => {
          const [id, threadId] = key.split(":");
          return threadId === message.threadID && userIds.has(id);
        })
        .sort((a, b) => b[1] - a[1])
        .slice(currentIndex, currentIndex + 5);
      
      if (isNaN(page) || page < 1) return send(`❌ Số trang không hợp lệ!`);
      if (top.length === 0) return send("😅 Dường như không có ai xếp hạng ở trang này.");
      
      const resultObj: Record<string, FieldInfo> = {};
      
      top.forEach(([key, count]) => {
        const [id] = key.split(":");
        const user = users.find(u => u.id === id);
        const name = normalizeText(user!.name || "");
        resultObj[name] = {
          count,
          avt: user!.thumbSrc || ""
        };
      });

      const outPath = path.join(manager.publicPath, "dist", "LB_GI.png");
      await createImage(resultObj, manager.publicPath, outPath, page);
    
      const maxPage = Math.floor(list.length / 5) + 1;

      api.sendMessage({
        body: `🏆⏤͟͟͞͞★${TT(`Bảng xếp hạng tương tác với ${TT("Nhóm", "boldSansSerif")} (${page}/${maxPage})`, "italicSerif")}`,
        attachment: [fs.createReadStream(outPath)]
      }, message.threadID);

    },
    
  } satisfies import("../types").BotCommand;
  