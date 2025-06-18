import path from "path";
import Jimp from "jimp";
import { Readable } from "stream";
import { API, CommandMessage as Message } from "../types";

// Type Definitions
type printType = API["sendMessage"] | undefined;
type N_B = number | boolean;

interface Sicbo_Images {
    dices: { index: 1 | 2 | 3 | 4 | 5 | 6; link?: string; url?: string }[];
    save_location: string;
}

interface SicBo_ITF {
    print?: printType;
    benchmark: number;
    number_of_dice: number;
    options: string[];
}

interface Result_POB {
    dices_score: number[];
    total_score: number;
    win: N_B;
    bet: number;
    message?: string;
}

interface MarkDown {
    bold: string;
    italic: string;
    strikeThrough: string;
    list: string;
}


function bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null); // kết thúc stream
    return stream;
  }

class SicBo_Game implements SicBo_ITF {
    print?: printType;
    benchmark: number;
    number_of_dice: number;
    options: string[];
    markDown: MarkDown;
    publicSrc: string;
    
    constructor(benchmark: number, number_of_dice: number, print?: printType, options: string[] = ["Under", "Over"]) {
        this.benchmark = benchmark;
        this.number_of_dice = number_of_dice;
        this.options = options;
        this.print = print;
        this.markDown = { bold: "*", italic: "#", strikeThrough: "~~", list: "-" };
        this.publicSrc = path.resolve(__dirname, "..", "..", "public", "sicbo")
    }

    public GetDefaultImages(): Sicbo_Images {
        return {
            dices: Array.from({ length: 6 }, (_, i) => ({
                index: (i + 1) as 1 | 2 | 3 | 4 | 5 | 6,
                url: `${path.resolve(this.publicSrc, (Array.from({ length: 6 }, (_, i) => `${i + 1}d`))[i])}.png`
            })),
            save_location: path.resolve(this.publicSrc, "result.png")
        };
    }

    public async PlaceOfBet(
        bet: number,
        language: "EN" | "VI",
        output: boolean = false,
        message: Message,
        callback: () => Promise<void>,
        image: boolean = true,
    ): Promise<Result_POB> {
        const dices_score = Array.from({ length: this.number_of_dice }, () => {
            const array = new Uint32Array(1);
            crypto.getRandomValues(array);
            return (array[0] % 6) + 1;
        });
        
        const total_score = dices_score.reduce((acc, curr) => acc + curr, 0);
        const win = total_score >= this.benchmark ? 1 : 0;

        const result: Result_POB = { dices_score, total_score, win: win === bet, bet };
        result.message = this.generateMessage(result, language);

        await callback();

        if (output && this.print) {
            try {
                if (image) {
                    const images = this.GetDefaultImages();
                    const resultImg = await this.CreateResultImage(images, dices_score, { returnStream: true });
                    
                    this.print(
                      {
                        body: result.message,
                        attachment: [resultImg]
                      },
                      message.threadID
                    );
                } else {
                    this.print(result.message, message.threadID);
                }
            } catch (error) {
                console.error("Error sending result image:", error);
                this.print(result.message, message.threadID);
            }
        } else if (output && !this.print) {
            console.warn("Print function is null or undefined.");
        }

        return result;
    }

    

    private generateMessage(result: Result_POB, language: "EN" | "VI"): string {
        const { dices_score, total_score, win, bet } = result;
        const { bold, list } = this.markDown;
        
        const list_dice_score = dices_score.map((value, index) => ` ${list} ${bold}${language === "VI" ? "Xúc xắc" : "Dice"} ${index + 1}:${bold} ${value}`).join("\n");
        
        return `${bold}${language === "VI" ? "KẾT QUẢ NÉM XÚC SẮC" : "DICE ROLL RESULTS"}${bold}\n${list_dice_score}\n` +
               ` ${list} ${bold}${language === "VI" ? "Tổng điểm" : "Total Score"}:${bold} ${total_score}\n` +
               ` ${list} ${bold}${language === "VI" ? "Cửa đặt cược" : "Betting Option"}:${bold} ${this.options[bet]}\n` +
               ` ${list} ${bold}${language === "VI" ? "Kết quả" : "Result"}:${bold} ${win ? (language === "VI" ? "Thắng" : "Win") : (language === "VI" ? "Thua" : "Lose")}\n\n` +
               (language === "VI" ? "Chúc bạn may mắn ở lần chơi tiếp theo! 🎲" : "Good luck on your next game! 🎲");
    }

    public async CreateResultImage(
        images: Sicbo_Images,
        dices_score: number[],
        options?: { returnStream?: boolean; save?: boolean }
    ): Promise<Buffer | NodeJS.ReadableStream | string> {
        const X_OFFSET = 120;
        const Y_OFFSET = 138;
        const DICE_WIDTH = 225;
        const DICE_HEIGHT = 225;
        const DICE_SPACING = 20;
        const DICE_SCALE = 1.35;
    
        try {
            if (!images.dices) throw new Error("images.dices is undefined.");
    
            const numDices = dices_score.length;
            const columns = numDices <= 3 ? numDices : 3;
            const rows = Math.ceil(numDices / 3);
    
            let width = columns * (DICE_WIDTH * DICE_SCALE + DICE_SPACING) + X_OFFSET * 1.3;
            let height = rows * (DICE_HEIGHT * DICE_SCALE + DICE_SPACING) + Y_OFFSET * 1.3;
    
            width = Math.max(1, Math.floor(width));
            height = Math.max(1, Math.floor(height));
    
            const baseImg = new Jimp(width, height, 0xffffffff);
    
            const diceImagePromises = dices_score.map(async (value) => {
                const index = images.dices.findIndex(item => item.index === value);
                if (index === -1) throw new Error(`Dice with index ${value} does not exist.`);
    
                const image_object = images.dices[index];
                const link = image_object.link ?? image_object.url;
                if (!link) throw new Error(`No valid link or URL found for dice index: ${value}.`);
    
                return await Jimp.read(link);
            });
    
            const dices_image = await Promise.all(diceImagePromises);
    
            dices_image.forEach((overImg, index) => {
                overImg.resize(DICE_WIDTH, DICE_HEIGHT);
                const col = index % columns;
                const row = Math.floor(index / columns);
                baseImg.composite(
                    overImg,
                    X_OFFSET + col * (DICE_WIDTH * DICE_SCALE + DICE_SPACING),
                    Y_OFFSET + row * (DICE_HEIGHT * DICE_SCALE + DICE_SPACING)
                );
            });
    
            const buffer = await baseImg.getBufferAsync(Jimp.MIME_PNG);
    
            if (options?.save) {
                const savePath = images.save_location;
                await baseImg.writeAsync(savePath);
                return savePath;
            }
    
            if (options?.returnStream) {
                return Readable.from(buffer);
            }
    
            return buffer;
        } catch (error) {
            console.error("Error creating result image:", error);
            throw error;
        }
    }
    
    
    
}

export { SicBo_Game, SicBo_ITF, Sicbo_Images };
