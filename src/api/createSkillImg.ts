import fs from 'fs';
import path from 'path';
import axios from 'axios';
import Jimp from 'jimp';
import sharp from "sharp";

const filePath = path.join(__dirname, '..');
const pathSkills = path.resolve(__dirname, "../public/skills");
const save_location = path.resolve(filePath, "public", "dist", "skillInfo.png")

interface Skill {
    id: string;
    imgUrl: string;
    attack?: number;
    defense?: number;
    level: number;
    rank: string;
    name: string;
}

function getApiUrl(rank: string, method: string): string | null {
    const baseUrl = "https://raw.githubusercontent.com/npk31/weapon-bot-chat-/main/src/data";
    const rankPath = rank.toLowerCase();
    if (["fight", "defense", "special"].includes(method)) {
        return `${baseUrl}/${rankPath}/${method}.json`;
    }
    return null;
}

async function fetchImage(imagePath: string): Promise<Buffer | null> {
    try {
        if (/^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(imagePath)) {
            const response = await axios.get(imagePath, { responseType: 'arraybuffer', timeout: 5000 });
            return Buffer.from(response.data, 'binary');
        } else if (fs.existsSync(imagePath)) {
            return fs.promises.readFile(imagePath);
        } else {
            console.error(`❌ Invalid image path: ${imagePath}`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error fetching image: ${imagePath}`, error);
        return null;
    }
}
type MT = "fight" | "defense" | "special";

async function createSkillPowerImage(
    idSkill: string,
    avatarUrl: string,
    rank: string,
    method: MT
  ): Promise<boolean> {
    try {
      const jsonUrl = getApiUrl(rank, method);
      if (!jsonUrl) return false;
  
      const res = await axios.get(jsonUrl);
      if (res.status !== 200) {
        console.error("Failed to get JSON data");
        return false;
      }
  
      const data: Skill[] = res.data;
      const skill = data.find((item) => item.id.toString() === idSkill);
      if (!skill) {
        console.error("Skill not found");
        return false;
      }
  
      const imagePath = `${pathSkills}/${method}/${method}_${rank}.png`;
      if (!fs.existsSync(imagePath)) {
        console.error("Image not found:", imagePath);
        return false;
      }
      skill.imgUrl = imagePath;
  
      const fonts = {
        font1: await Jimp.loadFont(
          path.join(filePath, "public", "font", "Inter42.fnt")
        ),
      };
  
      const baseImagePath = path.join(filePath, "public", "img", "SkillInfo_v2.png");
      if (!fs.existsSync(baseImagePath)) {
        console.error("Base image not found:", baseImagePath);
        return false;
      }
  
      let [avatarImageBuffer, skillImageBuffer] = await Promise.all([
        fetchImage(avatarUrl),
        fetchImage(skill.imgUrl),
      ]);
  
      if (!avatarImageBuffer || !skillImageBuffer) {
        console.error("❌ Failed to load avatar or skill image.");
        return false;
      }
  
      avatarImageBuffer = await sharp(avatarImageBuffer)
        .resize(100, 100)
        .toFormat("png")
        .toBuffer();
      skillImageBuffer = await sharp(skillImageBuffer)
        .resize(250, 250)
        .toFormat("png")
        .toBuffer();
  
      const baseImage = await Jimp.read(baseImagePath);
      const avatarImage = await Jimp.read(avatarImageBuffer);
      const skillImage = await Jimp.read(skillImageBuffer);
  
      avatarImage.resize(100, 100).circle();
      skillImage.resize(250, 250);
  
      baseImage.composite(avatarImage, 25, 25);
      baseImage.composite(skillImage, 235, 215);
  
      baseImage.print(fonts.font1, 800, 237.5, skill.name);

      baseImage.print(fonts.font1, (baseImage.bitmap.width - Jimp.measureText(fonts.font1, `${skill.attack || "0"}`)) / 2, 542.5, `${skill.attack || "0"}`);
      baseImage.print(fonts.font1, (baseImage.bitmap.width - Jimp.measureText(fonts.font1, `${skill.defense || "0"}`)) / 2, 642.5, `${skill.defense || "0"}`);
      baseImage.print(fonts.font1, (baseImage.bitmap.width - Jimp.measureText(fonts.font1, `${skill.level}`)) / 2, 740, `${skill.level}`);
      baseImage.print(fonts.font1, (baseImage.bitmap.width - Jimp.measureText(fonts.font1, `${skill.rank}`)) / 2, 830, `${skill.rank}`);
  
      await baseImage.writeAsync(
        path.join(save_location)
      );
      console.log("Image created successfully");
  
      return true;
    } catch (error) {
      console.error("Failed to create skill power image:", error);
      return false;
    }
  }

  export default { start: createSkillPowerImage, save_location }