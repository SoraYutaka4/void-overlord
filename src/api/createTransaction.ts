import Jimp from "jimp";
import path from "path";
import fs from "fs";
import axios from "axios";
import { checkApiStatus } from "./checkStatus";

const publicPath = path.join(__dirname, "..", "public");
const baseImgPath = path.join(publicPath, "img", "transaction.png");
const save_location = path.join(publicPath, "dist", "TST.png");
const fontDir = path.join(publicPath, "font");

function formatMoney(value: number | BigInt): string {
    const isNegative = typeof value === "bigint" ? value < 0n : (typeof value === "number" && value < 0);
    const num = typeof value === "bigint" ? value : BigInt(Math.floor(value as number));

    const units = ["", "K", "M", "B", "T", "Q", "Qa", "Qi", "S", "O", "N", "D"];
    let absNum = num < 0 ? -num : num;
    let unitIndex = 0;

    while (absNum >= 1000n && unitIndex < units.length - 1) {
        absNum /= 1000n;
        unitIndex++;
    }

    let formattedNumber = absNum.toString();

    // Nếu số nhỏ hơn 1000, không cần đơn vị (tránh hiển thị "$0")
    if (unitIndex === 0 && absNum < 1000n) {
        return `${isNegative ? "-$" : "$"}${formattedNumber}`;
    }

    return `${isNegative ? "-$" : "$"}${formattedNumber}${units[unitIndex]}`;
}

async function createTransactionImage(value: number | BigInt, name1?: string, name2?: string) {
    try {
        const money = formatMoney(value);

        // Kiểm tra nếu font tồn tại trước khi load
        const fontPath2 = path.join(fontDir, "Inter72.fnt");
        const fontPath4 = path.join(fontDir, "Inter52.fnt");

        if (!fs.existsSync(fontPath2) || !fs.existsSync(fontPath4)) {
            console.error("❌ Font file not found. Please check the font directory.");
            return;
        }

        // Load font
        const font2 = await Jimp.loadFont(fontPath2);
        const font4 = await Jimp.loadFont(fontPath4);
        const baseImg = await Jimp.read(baseImgPath);

        // Kiểm tra name1 và name2 để tránh lỗi undefined
        name1 = name1 ?? "Unknow" ;
        name2 = name2 ?? "Unknown";

        if (name1.length > 17) name1 = name1.slice(0, 15) + "....";
        if (name2.length > 17) name2 = name2.slice(0, 15) + "....";

        // Căn giữa văn bản
        const textWidth = Jimp.measureText(font2, money);
        const textHeight = Jimp.measureTextHeight(font2, money, baseImg.bitmap.width);
        const x = (baseImg.bitmap.width - textWidth) / 2;
        const y = 500 - textHeight / 2;

        baseImg.print(font2, x, y, money);
        baseImg.print(font4, 525, 780, name1.slice(0, 18));
        baseImg.print(font4, 525, 955, name2);

        await baseImg.writeAsync(save_location);

        console.log(`✅ Image created successfully at: ${save_location}`);
    } catch (error) {
        console.error("❌ Error while creating the image:", error);
    }
}

interface Info_Transaction {
    id1: string;
    id2: string;
    value: BigInt | number;
}

interface ERROR {
    status: number;
    error: string;
}

async function Transaction(info: Info_Transaction): Promise<boolean | ERROR> {
    try {
        const sender = await axios.get(`http://localhost:8000/api?id=${info.id1}&normal=true`);

        if (!checkApiStatus(sender.status)) {
            return {
                status: 111,
                error: "Sender API error",
            };
        }

        const receiver = await axios.get(`http://localhost:8000/api?id=${info.id2}&normal=true`);

        if (!checkApiStatus(receiver.status)) {
            return {
                status: 112,
                error: "Receiver API error",
            };
        }

        const remove_balance = await axios.patch(`http://localhost:8000/api`, {
            method: "balance",
            id: info.id1,
            value: -info.value,
        });

        if (!checkApiStatus(remove_balance.status)) {
            return {
                status: 113,
                error: "Failed to deduct balance",
            };
        }

        const add_balance = await axios.patch(`http://localhost:8000/api`, {
            method: "balance",
            id: info.id2,
            value: info.value,
        });

        if (!checkApiStatus(add_balance.status)) {
            return {
                status: 114,
                error: "Failed to add balance",
            };
        }

        await createTransactionImage(info.value, sender.data.name, receiver.data.name);

        return true;
    } catch (error) {
        console.error("❌ Transaction error:", error);
        return {
            status: 500,
            error: "Internal server error",
        };
    }
}

export default { start: Transaction, save_location };
