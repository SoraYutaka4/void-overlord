import fs from 'fs';
import path from 'path';
import axios from 'axios';
import Jimp from 'jimp';
import sharp from "sharp";


// interface Skill {
//     id: string;
//     imgUrl: string;
//     attack?: number;
//     defense?: number;
//     level: number;
//     rank: string;
//     name: string;
// }

type MT = "fight" | "defense" | "special";

type A = {
    method: MT | null,
    percent: number | null
};


const filePath = path.join(__dirname, "..");
const save_location = path.join(filePath, "public", "dist", "skillRandom.png");

async function CreateSkillRandomPowerImg(user: any, avatarUrl: string, rank: string, probability: string | null, adjust: A): Promise<boolean | number> {
    try {
        if (!user || !isValidRank(rank)) {
            console.log("User or rank is invalid");
            return 111;
        }
        if (user.balance < calculateDeduction(rank)) {
            console.log("Not enough balance");
            return 112;
        }

        const params = new URLSearchParams({
            id: user.id,
            rank
        });


        if (probability){
            if (probability.split("-").map(Number).length === 3){
                params.append("probability", probability);
            } else {
                return 101;
            }
        } else if (adjust.method && adjust.percent){
            params.append("method", adjust.method);
            params.append("percent", adjust.percent.toString());
        }


        const res = await axios.get(`http://localhost:8000/api/power/random?${params.toString()}`);
        if (res.status !== 200) return false;
        const skill = res.data;

        if (!skill.imgUrl) {
            console.error("❌Image not found:");
            return false;
        }

        const baseImgUrl = path.join(filePath, 'public', 'img', 'SkillGacha.png');

        let [avatarImgBuffer, skillImgBuffer] = await Promise.all([
            fetchImage(avatarUrl),
            fetchImage(skill.imgUrl)
        ]);

        if (!avatarImgBuffer || !skillImgBuffer) {
            console.error("❌ Không thể tải ảnh đại diện hoặc ảnh kỹ năng.");
            return false;
        }

        console.log("Converting images...");
        avatarImgBuffer = await sharp(avatarImgBuffer).resize(100, 100).toFormat('png').toBuffer();
        skillImgBuffer = await sharp(skillImgBuffer).resize(250, 250).toFormat('png').toBuffer();

        const [baseImg, avatarImg, skillImg] = await Promise.all([
            Jimp.read(baseImgUrl),
            Jimp.read(avatarImgBuffer),
            Jimp.read(skillImgBuffer)
        ]);

        console.log("Applying circular mask...");
        const circleMask = new Jimp(100, 100, 0x00000000);
        circleMask.scan(0, 0, 100, 100, (x, y) => {
            const dx = x - 50, dy = y - 50;
            if (dx * dx + dy * dy <= 50 * 50) {
                circleMask.setPixelColor(0xFFFFFFFF, x, y);
            }
        });

        avatarImg.mask(circleMask, 0, 0);
        baseImg.composite(avatarImg, 25, 25);
        baseImg.composite(skillImg, 245, 215);

        console.log("Adding text...");

        const fontPaths = [
            'Inter42.fnt',
            //  'Inter72.fnt', 'Inter52.fnt', 'Inter64Black.fnt', 
            // 'Inter32.fnt', 'PJS15Blue.fnt', 'PJS15.fnt', 'PJS32.fnt', 'Inter24.fnt'
        ];

        const fonts = await Promise.all(fontPaths.map(f => Jimp.loadFont(path.join(filePath, 'public', 'font', f))));
        baseImg.print(fonts[0], 800, 237.5, skill.name);
        baseImg.print(fonts[0], (baseImg.bitmap.width - Jimp.measureText(fonts[0], `${skill.attack || "0"}`)) / 2, 542.5, `${skill.attack || "0"}`);
        baseImg.print(fonts[0], (baseImg.bitmap.width - Jimp.measureText(fonts[0], `${skill.defense || "0"}`)) / 2, 642.5, `${skill.defense || "0"}`);
        baseImg.print(fonts[0], (baseImg.bitmap.width - Jimp.measureText(fonts[0], `${skill.level}`)) / 2, 740, `${skill.level}`);
        baseImg.print(fonts[0], (baseImg.bitmap.width - Jimp.measureText(fonts[0], `${skill.rank}`)) / 2, 830, `${skill.rank}`);

        await baseImg.writeAsync(save_location);
        console.log('✅ Image successfully created:', save_location);
        return true;
    } catch (error) {
        console.error('❌ Error generating image:', error);
        return false;
    }
}

function isValidRank(rank: string): boolean {
    return ["N", "R", "SR", "SSR"].includes(rank);
}

function calculateDeduction(rank: string): number {
    const deductionMap: Record<string, number> = {
        "N": 100, "R": 10 ** 4, "SR": 10 ** 6, "SSR": 10 ** 8
    };
    return deductionMap[rank] ?? -1;
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

export default { start: CreateSkillRandomPowerImg, save_location };