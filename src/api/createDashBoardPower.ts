import fs from "fs/promises";
import path from "path";
import axios from "axios";
import Jimp from "jimp";

const filePath = path.join(__dirname, "..");
const save_location = path.resolve(filePath, "public", "dist", "dashboard.png");

async function fetchImage(imagePath: string): Promise<Jimp | null> {
  try {
    let imageBuffer: Buffer;
    if (/^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(imagePath)) {
      const response = await axios.get(imagePath, {
        responseType: "arraybuffer",
        timeout: 5000,
      });
      imageBuffer = Buffer.from(response.data, "binary");
    } else if (await fs.access(imagePath).then(() => true).catch(() => false)) {
      imageBuffer = await fs.readFile(imagePath);
    } else {
      console.error(`❌ Invalid image path: ${imagePath}`);
      return null;
    }
    return await Jimp.read(imageBuffer);
  } catch (error) {
    console.error(`❌ Error fetching image: ${imagePath}`, error);
    return null;
  }
}

async function createDashboardPowerImage(
  user: any,
  avatarUrl: string
): Promise<boolean> {
  if (!user || !user.skillSlots || !user.skillSlots[0] || !user.powers || !user.powers[0]) {
    console.error("Error: Invalid user data.");
    return false;
  }

  const fonts = {
    font5: await Jimp.loadFont(path.join(filePath, "public", "font", "Inter32.fnt")),
    font9: await Jimp.loadFont(path.join(filePath, "public", "font", "Inter24.fnt")),
  };

  const baseImageUrl = path.join(filePath, "public", "img", "InfoUserPower.png");

  const [
    baseImage,
    avatarImage,
    image1,
    image2,
    image3,
    image4,
    image5,
  ] = await Promise.all([
    Jimp.read(baseImageUrl),
    fetchImage(avatarUrl),
    fetchImage(user.skillSlots[0].skillS1.imgUrl),
    fetchImage(user.skillSlots[0].skillS2.imgUrl),
    fetchImage(user.skillSlots[0].skillS3.imgUrl),
    fetchImage(user.skillSlots[0].skillS4.imgUrl),
    fetchImage(user.skillSlots[0].skillS5.imgUrl),
  ]);

  if (
    !baseImage ||
    !avatarImage ||
    !image1 ||
    !image2 ||
    !image3 ||
    !image4 ||
    !image5
  ) {
    console.error("Error: Failed to load one or more images.");
    return false;
  }

  const resizedImages = [avatarImage, image1, image2, image3, image4, image5];
  const resizeSizes = [100, 125, 125, 125, 125, 125];
  const compositePositions = [
    [25, 25],
    [300, 390],
    [600, 390],
    [885, 390],
    [1185, 390],
    [1475, 390],
  ];

  for (let i = 0; i < resizedImages.length; i++) {
    resizedImages[i].resize(resizeSizes[i], resizeSizes[i]);
    if (i === 0) {
      const circleMask = new Jimp(
        resizedImages[i].bitmap.width,
        resizedImages[i].bitmap.height,
        0x00000000
      );
      circleMask.scan(
        0,
        0,
        circleMask.bitmap.width,
        circleMask.bitmap.height,
        (x, y, idx) => {
          const dx = x - circleMask.bitmap.width / 2;
          const dy = y - circleMask.bitmap.height / 2;
          if (dx * dx + dy * dy <= (circleMask.bitmap.width / 2) ** 2) {
            circleMask.setPixelColor(0xffffffff, x, y);
          }
        }
      );
      resizedImages[i].mask(circleMask, 0, 0);
    }
    baseImage.composite(resizedImages[i], compositePositions[i][0], compositePositions[i][1]);
  }

  baseImage.print(fonts.font5, 820, 50, user.powers[0].attack);
  baseImage.print(fonts.font5, 1330, 50, user.powers[0].defense);
  baseImage.print(fonts.font5, 350, 206, user.level);
  baseImage.print(fonts.font5, 1035, 208, user.exp);

  const skillData = [
    { skill: user.skillSlots[0].skillS1, x: 260, y: 600, atk: true, hp: false },
    { skill: user.skillSlots[0].skillS2, x: 540, y: 600, atk: true, hp: false },
    { skill: user.skillSlots[0].skillS3, x: 845, y: 600, atk: false, hp: true },
    { skill: user.skillSlots[0].skillS4, x: 1145, y: 600, atk: false, hp: true },
    { skill: user.skillSlots[0].skillS5, x: 1435, y: 600, atk: true, hp: true },
  ];

  skillData.forEach(({ skill, x, y, atk, hp }) => {
    if (atk && hp) {
      baseImage.print(fonts.font9, x, y, `ATK: ${skill.attack}`);
      baseImage.print(fonts.font9, x, y + 50, `HP: ${skill.defense}`);
      baseImage.print(fonts.font9, x, y + 100, `LEVEL: ${skill.level}`);
      baseImage.print(fonts.font9, x, y + 150, `RANK: ${skill.rank}`);
    } else if (atk) {
      baseImage.print(fonts.font9, x, y, `ATK: ${skill.attack}`);
      baseImage.print(fonts.font9, x, y + 50, `LEVEL: ${skill.level}`);
      baseImage.print(fonts.font9, x, y + 100, `RANK: ${skill.rank}`);
    } else if (hp) {
      baseImage.print(fonts.font9, x, y, `HP: ${skill.defense}`);
      baseImage.print(fonts.font9, x, y + 50, `LEVEL: ${skill.level}`);
      baseImage.print(fonts.font9, x, y + 100, `RANK: ${skill.rank}`);
    }
  });

  await baseImage.writeAsync(save_location);
  console.log("Image created successfully");

  return true;
}

export default { start: createDashboardPowerImage, save_location };