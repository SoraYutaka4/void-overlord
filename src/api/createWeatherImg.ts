import Jimp from "jimp";
import path from "path";
import fs from "fs";

const imgPath = path.join(__dirname, "..", "public", "img");

function CovertCodeToPath(code: number, is_day: number): string | null {
    if (code === 1000) return path.join(imgPath, is_day ? "sunny.png" : "night_star.png");
    if ([1003, 1006].includes(code)) return path.join(imgPath, "cloudy.png");
    if (code === 1009) return path.join(imgPath, "Overcast.png"); 
    if ([1030, 1135, 1147].includes(code)) return path.join(imgPath, "sunny_cloudy.png");
    if ([1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195].includes(code)) {
        return path.join(imgPath, is_day ? "sunny_rain.png" : "night_rain.png");
    }
    if ([1240, 1243, 1246, 1249, 1252].includes(code)) return path.join(imgPath, "rain_with_thunder.png");
    if ([1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) return path.join(imgPath, "Winter.png");
    if ([1066, 1069, 1072, 1168, 1171, 1201, 1204, 1207, 1237, 1261, 1264].includes(code)) return path.join(imgPath, "winter_rain.png");
    if ([1273, 1276, 1087].includes(code)) return path.join(imgPath, "thunder.png");

    return null;
}

// const test = [1276, 0];

function AutoAdjustPosition(code: number, is_day: number): number[] {
    if (code === 1000) return is_day ? [552.5, 675] : [540, 665]; // Ngày nắng / Đêm sao
    if ([1003, 1006].includes(code)) return [535, 642]; // Nhiều mây
    if (code === 1009) return [553.5, 677]; // Overcast (u ám)
    if ([1030, 1135, 1147].includes(code)) return [537, 646]; // Sương mù
    if ([1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195].includes(code)) {
        return is_day ? [538.5, 645] : [553.25, 675.5]; // Mưa
    }
    if ([1240, 1243, 1246, 1249, 1252].includes(code)) return [552.5, 676]; // Dông, bão
    if ([1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) return [533.5, 642.5]; // Tuyết
    if ([1066, 1069, 1072, 1168, 1171, 1201, 1204, 1207, 1237, 1261, 1264].includes(code)) return [536, 644]; // Mưa đá
    if ([1273, 1276, 1087].includes(code)) return [553.5, 677.5]; // Sấm sét

    return [-30, -30]; // Mặc định nếu không tìm thấy
}


function HugeFaceAqiPath(num: number): string | null {
    if (num >= 0 && num <= 50) {
        return path.join(imgPath, "aq-status.png");
    } else if (num >= 51 && num <= 100) {
        return path.join(imgPath, "aq-status(1).png");
    } else if (num >= 101 && num <= 200) {
        return path.join(imgPath, "aq-status(4).png");
    } else if (num >= 201 && num <= 250) {
        return path.join(imgPath, "aq-status(2).png");
    } else if (num >= 251 && num <= 300) {
        return path.join(imgPath, "aq-status(3).png");
    } else if (num > 300) {
        return path.join(imgPath, "aq-status(5).png");
    }
    return null;
}

function HugeFaceUvPath(num: number): string | null {
    if (num >= 0 && num <= 2) {
        return path.join(imgPath, "aq-status.png");
    } else if (num >= 3 && num <= 5) {
        return path.join(imgPath, "aq-status(1).png");
    } else if (num >= 6 && num <= 7) {
        return path.join(imgPath, "aq-status(4).png");
    } else if (num >= 8 && num <= 10) {
        return path.join(imgPath, "aq-status(2).png");
    } else if (num > 11) {
        return path.join(imgPath, "aq-status(3).png");
    }
    return null;
}

export async function CreateWeatherImage(time: string, is_day: number, temp_c: number, feelslike_c: number, uv: number, gust_kph: number, aqi: number, aqi_status: string, cloud: number, humidity: number, name: string, country: string, text: string, code: number, uv_status: string) {
    try {
        // Load fonts
        const fonts = {
            font1: await Jimp.loadFont(path.join(imgPath, "..", "font", 'Inter42.fnt')),
            font2: await Jimp.loadFont(path.join(imgPath, "..", "font", 'Inter72.fnt')),
            font3: await Jimp.loadFont(path.join(imgPath, "..", "font", 'Inter52.fnt')),
            font4: await Jimp.loadFont(path.join(imgPath, "..", "font", 'Inter64Black.fnt')),
            font5: await Jimp.loadFont(path.join(imgPath, "..", "font", 'Inter32.fnt')),
            font6: await Jimp.loadFont(path.join(imgPath, "..", "font", "PJS15Blue.fnt")),
            font7: await Jimp.loadFont(path.join(imgPath, "..", "font", "PJS15.fnt")),
            font8: await Jimp.loadFont(path.join(imgPath, "..", "font", "PJS32.fnt"))
        };

        // Get image paths
        const baseImgPath = CovertCodeToPath(code, is_day);
        const temp_c_imgPath = path.join(imgPath, "temp_c.png");
        const hugeFaceAqiPath = HugeFaceAqiPath(Math.floor(aqi));
        const hugeFaceUvPath = HugeFaceUvPath(Math.floor(uv));
        const dropIconPath = path.join(imgPath, "Drop.png");

        // Check if paths are valid
        if (!baseImgPath || !hugeFaceAqiPath || !hugeFaceUvPath) {
            throw new Error("Invalid image path(s).");
        }

        // Load images
        const baseImg = await Jimp.read(baseImgPath);
        const temp_c_img = await Jimp.read(temp_c_imgPath);
        const hugeFaceAqi = (await Jimp.read(hugeFaceAqiPath)).resize(15, 15);
        const hugeFaceUv = (await Jimp.read(hugeFaceUvPath)).resize(15, 15);
        const dropIcon = await Jimp.read(dropIconPath);

        // Print text on image
        baseImg.print(fonts.font8, 175, 125, name);
        const timeArr = time.split(" ");
        baseImg.print(fonts.font7, 175, 170, timeArr[0] + " | ");
        baseImg.print(fonts.font6, 275, 170, timeArr[1]);
        baseImg.print(fonts.font3, 550, 140, `${temp_c}`);
        baseImg.composite(temp_c_img, 625, 140);
        baseImg.composite(hugeFaceAqi, 175, 217.5);
        baseImg.composite(hugeFaceUv, 175, 242.5);
        baseImg.composite(dropIcon, 175, 267.5);
        baseImg.print(fonts.font7, 200, 215, `AQI: ${aqi} (${aqi_status})`);
        baseImg.print(fonts.font7, 200, 240, `UV: ${uv}`);
        baseImg.print(fonts.font7, 200, 265, `${humidity}%`);
        baseImg.print(fonts.font7, 425, 300, `${gust_kph} km/h`);

        const [x1, x2] = AutoAdjustPosition(code, is_day);
        baseImg.print(fonts.font7, x1, 300, `${cloud}%`);
        baseImg.print(fonts.font7, x2, 300, `${uv}`);
        
        baseImg.crop(105, 85, 635, 250);

        const weatherDir = path.join(__dirname, "..", "public", "weather");
        if (!fs.existsSync(weatherDir)) fs.mkdirSync(weatherDir, { recursive: true });

        // Save image
        await baseImg.writeAsync(path.join(weatherDir, "w.png"));

        console.log("Đã tạo hình ảnh thành công!");
    } catch (error) {
        console.error("Error creating weather image:", error);
    }
}
