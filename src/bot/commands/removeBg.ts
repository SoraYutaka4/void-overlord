import { get_API_Key } from "../../key";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";

const ensureDirectoryExists = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const checkApiStatus = (statusCodeOrFn: number | (() => number)): boolean => {
    const statusCode = typeof statusCodeOrFn === "function" ? statusCodeOrFn() : statusCodeOrFn;
    return statusCode >= 200 && statusCode < 300;
};

async function removeBackground(url: string): Promise<string | void> {
    const API_KEYS = get_API_Key("removebg");
    const API_URL = "https://api.remove.bg/v1.0/removebg";

    if (!API_KEYS || API_KEYS.length === 0) {
        console.error("❌ API key is not set.");
        return;
    }

    try {
        const res1 = await axios.get(url, { responseType: "arraybuffer" });
        const imageBufferInput = Buffer.from(res1.data);

        let attempt = 0;
        const maxRetries = 3;

        while (attempt < maxRetries) {
            const randomAPIKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];

            const formData = new FormData();
            formData.append("size", "auto");
            formData.append("image_file", imageBufferInput, "input.png");

            try {
                const res2 = await axios.post(API_URL, formData, {
                    headers: {
                        ...formData.getHeaders(),
                        "X-Api-Key": randomAPIKey,
                    },
                    responseType: "arraybuffer",
                });

                if (checkApiStatus(res2.status)) {
                    const imageBufferOutput = Buffer.from(res2.data);

                    const outputDir = path.join(__dirname, "cache/generated");
                    ensureDirectoryExists(outputDir);

                    const outputPath = path.join(outputDir, `removebg_${uuidv4()}.png`);
                    fs.writeFileSync(outputPath, imageBufferOutput);

                    console.log(`✅ Remove background success on attempt ${attempt + 1}`);
                    return outputPath;
                } else {
                    console.warn(`⚠️ Attempt ${attempt + 1}: API returned bad status ${res2.status} (${res2.statusText})`);
                }
            } catch (err) {
                console.warn(`⚠️ Attempt ${attempt + 1}: Failed with token ${randomAPIKey}`, (err as any).data || err);
            }

            attempt++;
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 250));
            }
        }

        console.error(`❌ Failed after ${maxRetries} attempts.`);
        return;
    } catch (error) {
        console.error("❌ Error downloading input image:", error);
    }
}

export default {
    info: {
        name: "xoanen",
        description: "Xoá nền hình ảnh",
        version: "1.0.0",
        prefix: true,
        aliases: ["removebg"],
        usage: "<Gửi ảnh>",
        cooldown: 10000,
        // rules: {
        //     balance: 50000,
        // },
        freeUse: true,
    },

    execute: async ({ api, message, cprompt, manager}) => {
        api.sendMessage(">👀 Hãy gửi 1 ảnh mà bạn muốn xóa.", message.threadID);

        const { onCooldown, remaining } = manager.cooldowns.isOnCooldown(message.senderID, "rmbg:command");
        if (onCooldown) return api.sendMessage(`Còn ${Math.ceil(remaining / 1000)}s`, message.threadID, undefined, message.messageID);

        cprompt.create(message.senderID, async (message) => {
            const attachment = message.attachments[0];
    
            if (!attachment || !attachment.url || attachment.type !== "photo") {
                api.sendMessage("Vui lòng gửi ảnh để xóa nền", message.threadID, undefined, message.messageID);
                return;
            }
    
            const imageUrl = attachment.url;
    
            try {
                const result = await removeBackground(imageUrl);
                manager.cooldowns.setCooldown(message.senderID, "rmbg:command", 2 * 60 * 1000);

                if (result) {
                    await api.sendMessage({
                        attachment: [fs.createReadStream(result)],
                    }, message.threadID);
    
                    fs.unlinkSync(result);
                } else {
                    api.sendMessage("Không thể xóa nền ảnh này", message.threadID, undefined, message.messageID);
                }
    
                // await manager.users.updateUser(message.senderID, "balance", -50000);
    
            } catch (error) {
                console.error("Error in remove background command:", error);
                api.sendMessage("Đã xảy ra lỗi khi xóa nền ảnh", message.threadID, undefined, message.messageID);
            }
        }, 2 * 60000);
    },
} satisfies import("../types").BotCommand;
