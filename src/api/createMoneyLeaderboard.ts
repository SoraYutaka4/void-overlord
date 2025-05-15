import path from "path";
import Jimp from "jimp";
import { PrismaClient } from "@prisma/client";

const publicPath = path.join(__dirname, "..", "public");
const baseImgPath1 = path.join(publicPath, "img", "leaderboard_money_vn.png");
const baseImgPath2 = path.join(publicPath, "img", "leaderboard2_money_vn.png");
const saveLocation = path.join(publicPath, "dist", "LB_money.png");

const prisma = new PrismaClient();
const fontCache: Record<string, JimpFont> = {};

interface Leaderboard {
    name: string;
    amount: string;
}

interface JimpFont {
    chars: any;
    kernings: any;
    common: any;
    pages: any[];
    info: any;
}

interface ERROR {
    status: number;
    error: string;
}

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
        console.error(`❌ Failed to load font (${fontPath}):`, error);
        throw new Error("Font loading failed.");
    }
}

function formatMoney(value: number | BigInt): string {
    const isNegative = typeof value === "bigint" ? value < 0n : (value as number) < 0;
    const num = typeof value === "bigint" ? value : BigInt(Math.floor(value as number));

    const units = ["", "K", "M", "B", "T", "Q", "Qa", "Qi", "S", "O", "N", "D"];
    let absNum = num < 0 ? -num : num;
    let unitIndex = 0;

    while (absNum >= 1000n && unitIndex < units.length - 1) {
        absNum /= 1000n;
        unitIndex++;
    }

    const formatted = absNum.toString();
    return `${isNegative ? "-$" : "$"}${formatted}${units[unitIndex]}`;
}

async function createLeaderboardImage(info: Leaderboard[], page: number, pageSize = 4): Promise<boolean> {
    try {
        const isFirstPage = page === 1;
        const image = await Jimp.read(isFirstPage ? baseImgPath1 : baseImgPath2);

        const fontName = await loadFont(fontPaths.Montserrat54Bold);
        const fontAmount = await loadFont(fontPaths.Montserrat64Bold);
        const fontIndex = await loadFont(fontPaths.Montserrat84Bold);

        const offset = (page - 1) * pageSize;

        info.forEach((user, i) => {
            const displayName = user.name.length > 32 ? user.name.slice(0, 29) + "..." : user.name;
            const yPos = 180 + 150 * i;

            // Trang 2 trở đi mới in số thứ tự
            if (!isFirstPage) {
                image.print(fontIndex, 127.5, yPos - 15, offset + i + 1);
            }

            image.print(fontName, 250, yPos, displayName);
            image.print(fontAmount, 1140, yPos - 5, user.amount);
        });

        await image.writeAsync(saveLocation);
        console.log("✅ Leaderboard image created:", saveLocation);
        return true;
    } catch (error) {
        console.error("❌ Error creating leaderboard image:", error);
        return false;
    }
}


async function getRankingInfo(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    try {
        const total = await prisma.user.count();
        const users = await prisma.user.findMany({
            orderBy: { balance: "desc" },
            take: pageSize,
            skip: offset,
        });

        const data = users.map((user) => ({
            name: user.name,
            amount: formatMoney(user.balance),
        }));

        return { data, total };
    } catch (error) {
        console.error("❌ Failed to fetch ranking info:", error);
        return { data: [], total: 0 };
    }
}

async function moneyLeaderboard(page: number): Promise<
    | {
          page: number;
          totalPages: number;
          data: Leaderboard[];
          imagePath: string;
      }
    | ERROR
> {
    const pageSize = 4;
    const { data, total } = await getRankingInfo(page, pageSize);

    if (data.length === 0) {
        return { status: 111, error: "No data found for this page." };
    }

    const imageCreated = await createLeaderboardImage(data, page);
    if (!imageCreated) {
        return { status: 112, error: "Failed to generate image." };
    }

    const totalPages = Math.ceil(total / pageSize);
    return {
        page,
        totalPages,
        data,
        imagePath: saveLocation,
    };
}

export default { start: moneyLeaderboard, saveLocation };
