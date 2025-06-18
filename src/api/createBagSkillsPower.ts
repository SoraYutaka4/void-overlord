import fs from "fs";
import path from "path";
import axios from "axios";
import Jimp from "jimp";

const filePath = path.join(__dirname, "..");
const save_location = path.resolve(filePath, "public", "dist", "bag.png")

async function fetchImage(imagePath: string): Promise<Jimp | null> {
    try {
        if (/^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(imagePath)) {
            const response = await axios.get(imagePath, { responseType: 'arraybuffer', timeout: 5000 });
            return Jimp.read(Buffer.from(response.data, 'binary'));
        } else if (fs.existsSync(imagePath)) {
            return Jimp.read(imagePath);
        } else {
            console.error(`❌ Invalid image path: ${imagePath}`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error fetching image: ${imagePath}`, error);
        return null;
    }
}

async function loadFonts() {
    return {
        font2: await Jimp.loadFont(path.join(filePath, "public", "font", 'Inter72.fnt')),
        font5: await Jimp.loadFont(path.join(filePath, "public", "font", 'Inter32.fnt'))
    };
}


type M = "fight" | "defense" | "special";

async function CreateBagSkillPowerImg(user: any, avtUrl: string, page: number, type: M | null) {
    try {
        const params = new URLSearchParams({
            id: user.id,
            page: page.toString(),
            avt: encodeURI(avtUrl)
        });

        if (type){
            params.append("type", type);
        }

        const { data: skills, status } = await axios.get(`http://localhost:8000/api/power/getpageskill?${params.toString()}`);
        if (status !== 200 || !skills || skills.length < 3) {
            console.error("❌ Failed to fetch or insufficient skills data");
            return false;
        }

        const fonts = await loadFonts();
        const baseImgUrl = path.join(filePath, "public", "img", "Skill Bag.png");

        // Load tất cả ảnh song song để tối ưu hiệu suất
        const [baseImg, avtImg, Img1, Img2, Img3] = await Promise.all([
            Jimp.read(baseImgUrl),
            fetchImage(avtUrl),
            fetchImage(skills[0].imgUrl),
            fetchImage(skills[1].imgUrl),
            fetchImage(skills[2].imgUrl)
        ]);

        if (!avtImg || !Img1 || !Img2 || !Img3) {
            console.error("❌ Some images failed to load");
            return false;
        }

        avtImg.resize(100, 100);
        Img1.resize(150, 150);
        Img2.resize(150, 150);
        Img3.resize(150, 150);

        // Mask hình tròn cho avatar
        const circleMask = new Jimp(avtImg.bitmap.width, avtImg.bitmap.height, 0x00000000);
        circleMask.scan(0, 0, circleMask.bitmap.width, circleMask.bitmap.height, (x, y) => {
            const dx = x - circleMask.bitmap.width / 2;
            const dy = y - circleMask.bitmap.height / 2;
            if (dx * dx + dy * dy <= (circleMask.bitmap.width / 2) ** 2) {
                circleMask.setPixelColor(0xFFFFFFFF, x, y);
            }
        });
        avtImg.mask(circleMask, 0, 0);

        // Ghép ảnh vào nền
        baseImg.composite(avtImg, 25, 25);
        baseImg.composite(Img1, 600, 250);
        baseImg.composite(Img2, 600, 485);
        baseImg.composite(Img3, 600, 705);

        // In thông tin lên ảnh
        printText(baseImg, { font1: fonts.font2, font2: fonts.font5 }, user, page, skills);

        // Xuất file ảnh
        await baseImg.writeAsync(save_location);
        console.log("✅ Hình ảnh đã được tạo thành công");

        return true;
    } catch (error) {
        console.error("❌ Failed to create bag image:", error);
        return false;
    }
}

function printText(baseImg: Jimp, font: any, user: any, page: number, skills: any[]) {
    try {
        const bagSkills = user.bagSkills[0] || {};
        const fightLength = (bagSkills.fight && JSON.parse(bagSkills.fight).length) || 0;
        const defenseLength = (bagSkills.defense && JSON.parse(bagSkills.defense).length) || 0;
        const specialLength = (bagSkills.special && JSON.parse(bagSkills.special).length) || 0;

        baseImg.print(font.font2, 820, 50, fightLength);
        baseImg.print(font.font2, 1060, 47.5, defenseLength);
        baseImg.print(font.font2, 1315, 50, specialLength);
        baseImg.print(font.font2, 1595, 50, page);

        baseImg.print(font.font1, 360, 295, "1");
        baseImg.print(font.font1, 360, 520, "2");
        baseImg.print(font.font1, 360, 745, "3");

        for (let i = 0; i < 3; i++) {
            baseImg.print(font.font2, 850, 270 + i * 225, `Name: ${skills[i].name}`);
            baseImg.print(font.font2, 850, 320 + i * 225, `ATK: ${skills[i].attack || "0"}`);
            baseImg.print(font.font2, 850, 370 + i * 225, `HP: ${skills[i].defense || "0"}`);
        }
    } catch (error) {
        console.error("❌ Error while printing text:", error);
    }
}

export default { start: CreateBagSkillPowerImg, save_location };
