import path from "path";
import Jimp from "jimp";
import axios from "axios";
import { checkApiStatus } from "./checkStatus";

const publicPath = path.join(__dirname, "..", "public");
const baseImgPath = path.join(publicPath, "img", "Wallet_4x.png");
const save_location = path.join(publicPath, "dist", "debit_card.png");

interface JimpFont {
    chars: any;
    kernings: any;
    common: any;
    pages: any[];
    info: any;
}


const fontCache: Record<string, JimpFont> = {};

const fontPaths = {
    Inter42: path.join(publicPath, "font", "Inter42.fnt"),
    Montserrat54Bold: path.join(publicPath, "font", "Montserrat_54_Bold.fnt"),
    Montserrat64Bold: path.join(publicPath, "font", "Montserrat_64_Bold.fnt"),
    Montserrat84Bold: path.join(publicPath, "font", "Montserrat_84_Bold.fnt"),
    Montserrat128Bold: path.join(publicPath, "font", "Montserrat_128_Bold.fnt"),
};

async function loadFont(fontPath: string) {
    if (fontCache[fontPath]) return fontCache[fontPath];

    try {
        const font = await Jimp.loadFont(fontPath);
        fontCache[fontPath] = font;
        return font;
    } catch (error) {
        console.error(`❌ Error loading font (${fontPath}):`, error);
        throw new Error("Font loading failed.");
    }
}

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

    if (unitIndex === 0 && absNum < 1000n) {
        return `${isNegative ? "-$" : "$"}${formattedNumber}`;
    }

    return `${isNegative ? "-$" : "$"}${formattedNumber}${units[unitIndex]}`;
}

function removeDiacritics(input: string): string {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function createWalletImage(name: string, time: string, balance: string) {
    try {
        const image = await Jimp.read(baseImgPath);
        const font1 = await loadFont(fontPaths.Inter42);

        const displayName = removeDiacritics(name.length > 26 ? name.substring(0, 23) + "..." : name);

        const textWidth = Jimp.measureText(font1, displayName);
        const xPos = Math.max(0, image.bitmap.width - textWidth - 85);

        image.print(font1, xPos, 116, displayName);
        image.print(font1, 64, 450, time);

        let balanceFontPath = fontPaths.Montserrat128Bold;

        if (balance.length > 36) {
            balanceFontPath = fontPaths.Montserrat54Bold;
        } else if (balance.length > 28) {
            balanceFontPath = fontPaths.Montserrat64Bold;
        } else if (balance.length > 16) {
            balanceFontPath = fontPaths.Montserrat84Bold;
        }

        const balanceFont = await loadFont(balanceFontPath);
        image.print(balanceFont, 64, 517.5, balance);

        await image.writeAsync(save_location);
        console.log("✅ Image has been created:", save_location);
    } catch (error) {
        console.error("❌ Error while creating image:", error);
    }
}

interface ERROR {
    status: number;
    error: string;
}

async function GetWallet(id: string, suffix: boolean = true): Promise<ERROR | boolean> {
    if (!id || typeof id !== "string") {
        return { status: 400, error: "Invalid ID format" };
    }

    try {
        const userRes = await axios.get(`http://localhost:8000/api?id=${id}&normal=true`, { timeout: 5000 });

        if (!checkApiStatus(userRes.status) || !userRes.data || typeof userRes.data !== "object") {
            return { status: 111, error: "User not found" };
        }

        const { name, balance }: { name: string, balance: number | bigint } = userRes.data;

        if (!name || typeof balance === "undefined") {
            return { status: 112, error: "Invalid user data format" };
        }

        const c = new Date();
        const time = [
            String(c.getHours()).padStart(2, '0'),
            String(c.getMinutes()).padStart(2, '0'),
        ].join(":") + " - " + [
            String(c.getDate()).padStart(2, '0'),
            String(c.getMonth() + 1).padStart(2, '0'),
            c.getFullYear(),
        ].join("/");

        const absBalance = balance < 0 ? -balance : balance;
        const formatted = absBalance.toLocaleString();
        const sign = balance < 0 ? "-$" : "$";

        const formatBalance = suffix 
        ? formatMoney(balance) 
        : `${sign}${formatted}`;

        await createWalletImage(name, time, formatBalance);
        return true;
    } catch (error) {
        console.error("❌ Error while fetching wallet:", error);
        return { status: 500, error: "Internal server error" };
    }
}

export default { start: GetWallet, save_location };
