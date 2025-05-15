import Jimp from "jimp";
import fs from "fs";
import path from "path";
import axios from "axios";

const publicPath =  path.join(__dirname, "..", "public")
const baseImgPath = path.join(publicPath, "img", "user.png");
const save_location = path.join(publicPath, "dist", "userInfoBar.png");

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

async function createUserInfoBar(name: string, avtUrl: string): Promise<boolean> {
    try {
        const baseImg = await Jimp.read(baseImgPath);
        const avtBuffer = await fetchImage(avtUrl);
        
        if (!avtBuffer) {
            console.error("❌ Failed to load avatar. Using default image.");
            return false;
        }

        const avt = await Jimp.read(avtBuffer);
        avt.resize(173, 173);

        // Create a circular mask
        const circleMask = new Jimp(avt.bitmap.width, avt.bitmap.height, 0x00000000);
        circleMask.scan(0, 0, circleMask.bitmap.width, circleMask.bitmap.height, (x: number, y: number) => {
            const dx = x - circleMask.bitmap.width / 2;
            const dy = y - circleMask.bitmap.height / 2;
            if (dx * dx + dy * dy <= (circleMask.bitmap.width / 2) ** 2) {
                circleMask.setPixelColor(0xFFFFFFFF, x, y);
            }
        });

        avt.mask(circleMask, 0, 0);

        baseImg.composite(avt, 1100, 20);

        if (name.length > 45 ) {
            const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
            let h = Jimp.measureTextHeight(font, name.slice(0, 45) + ".....", baseImg.bitmap.width);
            let centerH = ( baseImg.bitmap.height - h ) / 2;
            baseImg.print(font, 150, centerH, name.slice(0, 45) + ".....");

        } else if (name.length <= 20) {
            const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
            let h = Jimp.measureTextHeight(font, name, baseImg.bitmap.width);
            let centerH = ( baseImg.bitmap.height - h ) / 2;
            baseImg.print(font, 100, centerH, name);
        } else {
            const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
            let h = Jimp.measureTextHeight(font, name, baseImg.bitmap.width);
            let centerH = ( baseImg.bitmap.height - h ) / 2;
            baseImg.print(font, 150, centerH, name);
        }

        await baseImg.writeAsync(save_location);

        console.log(`✅ Image created successfully at: ${save_location}`);

        return true;

    } catch (error) {
        console.error("❌ Error while creating the image:", error);
        return false;
    }
}

export default { start: createUserInfoBar, save_location };
