import axios from "axios";
import FormData from "form-data";
import Jimp from "jimp";
import path from "path";
import fs from "fs";
import validator from "validator";
import { parse } from "node-html-parser";
import { translateText } from "../utils/langs";
import { get_API_Key } from "../../key";

function htmlToText(html: string): string {
    const formatted = html
      .replace(/\n/g, "") 
      .replace(/<br\s*\/?>/gi, "\n"); 
  
    const text = parse(formatted).text;
    return text.trim();
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
    try {
      const response = await axios.get<ArrayBuffer>(url, {
        responseType: "arraybuffer",
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error("Error while getting buffer:", error);
      return null;
    }
  }

const p = (end: string, dir: string = __dirname) => path.join(dir, end);

type IMGInfo = {
    coverImg: string;
    name: string;
    description: string;
    color?: string | number;
    bannerImg?: string;
}

async function createImage(info: IMGInfo, publicPath: string, outputPath: string): Promise<void> {
  try {
    const fontPath = p("font", publicPath);
    const width = 1000;
    const height = 350;
    const bgColor = info.color || 0x2f2f2fff;

    const baseImg = new Jimp(width, height, bgColor);

    if (info.bannerImg) {
      const bannerBuffer = await fetchBuffer(info.bannerImg);
      if (bannerBuffer) {
        try {
          const banner = await Jimp.read(bannerBuffer);
          banner.cover(width, height).opacity(0.5);
          baseImg.composite(banner, 0, 0);
        } catch (error) {
          console.error("Error while processing banner image:", error);
        }
      }
    }

    if (info.coverImg) {
      const coverBuffer = await fetchBuffer(info.coverImg);
      if (coverBuffer) {
        try {
          const cover = await Jimp.read(coverBuffer);
          cover.resize(200, 275);
          baseImg.composite(cover, 32, 40);
        } catch {}
      }
    }

    const [fontTitle, fontDesc] = await Promise.all([
      Jimp.loadFont(p("Montserrat_54_Bold.fnt", fontPath)),
      Jimp.loadFont(p("Inter_21_Bold.fnt", fontPath))
    ]);

    baseImg.print(fontTitle, 260, 40, {
      text: info.name,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    }, 700, 50);

    const maxWidth = 675; 
    const desc = htmlToText(info.description || "").slice(0, 600); 
    const lines = [];

    let line = '';
    
    for (const word of desc.split(' ')) {
      const testLine = line ? `${line} ${word}` : word;
      const testWidth = Jimp.measureText(fontDesc, testLine);

      if (testWidth <= maxWidth) {
        line = testLine;
      } else {
        lines.push(line);
        line = word;
      }
    }

    if (line) lines.push(line);

    if (desc.length > 600) {
      lines[lines.length - 1] += '...';
    }

    const finalText = lines.join('\n');

    const descX = 260;
    const descMaxWidth = 700;
    const descY = 105; 

    baseImg.print(fontDesc, descX, descY, {
      text: finalText,
      alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
    }, descMaxWidth, 240); 

    await baseImg.writeAsync(outputPath);
    console.log("✅ Saved image at:", outputPath);
  } catch (error) {
    console.error("❌ Failed to create image:", error);
  }
}

async function getAnimeById(id: number, token: string) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          large
        }
        startDate {
          day
          month
          year
        }
        genres
        bannerImage
        characters(role: MAIN) {
          nodes {
            name {
              full
              first
            }
            image {
              large
            }
          }
        }
        isAdult
        seasonYear
        duration
        format
        episodes
        studios {
          edges {
            isMain
            node {
              name
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      "https://graphql.anilist.co",
      {
        query,
        variables: { id },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    return response.data.data.Media;
  } catch (error: any) {
    console.error("❌ Error fetching anime:", error.response?.data || error.message);
    throw error;
  }
}


export default {
  info: {
    name: "doananime",
    description: "Đoán bộ anime bằng hình ảnh",
    version: "1.0.0",
    prefix: true,
    aliases: ["traceanime", "timanime"],
    rules: {
      balance: 20000
    },
    credits: "NPK31",
    usage: "Gửi ảnh kèm lệnh"
  },

  execute: async ({ api, message, manager, normalizeText, styleText, cprompt }) => {
    api.sendMessage(`📸 Gửi tấm ảnh anime nào đó đi, để tớ thử đoán coi là ai nè~`, message.threadID);
    
    cprompt.create(message.senderID, async (message, parsedMessage) => {
      const link = parsedMessage.query.link;
      const attachment = message.attachments?.[0];
      if ((!attachment || !(attachment.type === "photo" || attachment.type === "animated_image" )) && !link) {
        return api.sendMessage("❌ Gửi lại lệnh và  *một ảnh anime* để đoán!", message.threadID);
      }
  
      if (link && !(
        link.startsWith("http://localhost") ||
        link.startsWith("https://localhost") ||
        link.startsWith("http://127.0.0.1") ||
        link.startsWith("https://127.0.0.1") ||
        link.startsWith("http://[::1]") ||
        link.startsWith("https://[::1]") ||
        validator.isURL(link, { require_protocol: true })
      )) {
        return api.sendMessage("😥 Link không hợp lệ!", message.threadID);
      }
    
      const tokens = get_API_Key("ANILIST_TOKEN");

      if (!tokens?.length){
        console.error("[ANILIST_TOKEN] Missing AniList Acess Token.");
        return;
      }
        
      const access_token = tokens[Math.floor(Math.random() * tokens.length)];
      if (!access_token) {
        return api.sendMessage("⚠️ Chưa có token AniList!", message.threadID);
      }
    
      try {
        const imageRes = await axios.get(attachment?.url || encodeURI(link), { responseType: "arraybuffer" });
    
        const form = new FormData();
        form.append("image", Buffer.from(imageRes.data), {
          filename: "anime.jpg",
          contentType: "image/jpeg"
        });
  
        await manager.users.updateUser(message.senderID, "balance", -20000);
  
        const res = await axios.post("https://api.trace.moe/search", form, {
          headers: form.getHeaders(),
        });
    
        const result = res.data.result?.[0];
        if (!result) {
          return api.sendMessage("❌ Không thể nhận diện anime từ ảnh này!", message.threadID);
        }
    
        const { similarity, anilist } = result;
        const percent = (similarity * 100).toFixed(2);
        const animeInfo = await getAnimeById(anilist, access_token);
  
        const output = path.join(manager.publicPath, "dist/trace_anime.png");
  
        await createImage({
          coverImg: animeInfo.coverImage.large,
          name: animeInfo.title.romaji || "Không rõ",
          description: normalizeText(await translateText(htmlToText(animeInfo.description), "vi") || animeInfo.description || ""),
          bannerImg: animeInfo.bannerImage
        }, manager.publicPath, output);
  
        const bold = (str: string) => styleText(str, "boldSerif");
  
const msg = `
🎬 ${bold("Anime")}: ${animeInfo.title.english || animeInfo.title.romaji || "Không rõ"}
📅 ${bold("Năm")}: ${animeInfo.startDate?.year || "?"}
🎭 ${bold("Thể loại")}: ${animeInfo.genres?.join(", ") || "Không rõ"}
🔞 ${bold("18+")}: ${animeInfo.isAdult ? "Có" : "Không"}
📺 ${bold("Số tập")}: ${animeInfo.episodes ?? "?"}
🔍 ${bold("Độ chính xác")}: ${percent}%
`;
    
        api.sendMessage({body: msg, attachment: [fs.createReadStream(output)], avoid: {obfuscate: false, delay: false}}, message.threadID);
      } catch (err) {
        console.error("An Error has occured while tracing anime");
        api.sendMessage("⚠️ Có lỗi xảy ra khi xử lý ảnh. Thử lại sau nhé!", message.threadID);
      }

    }, 60000)
  }
} satisfies import("../types").BotCommand;
