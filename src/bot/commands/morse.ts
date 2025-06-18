const morseCodeMap: Record<string, string> = {
    A: ".-",     B: "-...",   C: "-.-.",   D: "-..",    E: ".",      F: "..-.",
    G: "--.",    H: "....",   I: "..",     J: ".---",   K: "-.-",    L: ".-..",
    M: "--",     N: "-.",     O: "---",    P: ".--.",   Q: "--.-",   R: ".-.",
    S: "...",    T: "-",      U: "..-",    V: "...-",   W: ".--",    X: "-..-",
    Y: "-.--",   Z: "--..",
    0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-",
    5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
    " ": "/",   ".": ".-.-.-", ",": "--..--", "?": "..--.."
};

const morseToTextMap = Object.fromEntries(
    Object.entries(morseCodeMap).map(([k, v]) => [v, k])
);

const encodeToMorse = (text: string) => {
    return text
        .toUpperCase()
        .split("")
        .map(char => morseCodeMap[char] || "")
        .join(" ");
};

const decodeFromMorse = (morse: string) => {
    return morse
        .split(" ")
        .map(symbol => morseToTextMap[symbol] || "")
        .join("");
};

export default {
    info: {
        name: "morse",
        description: "Mã hóa và giải mã Morse",
        usage: "morse <mahoa|giaima> <text>",
        example: [
            "morse mahoa Xin chao",
            "morse giaima -..- .. -. / -.-. .... .- ---"
        ],
        version: "1.0.0",
        prefix: true,
        rules: {
            balance: 50
        },
        category: "Tool",
        credits: "NPK31"
    },

    execute: ({api, message, parsedMessage}) =>{
        const args = parsedMessage.args;
        const mode = args[1];
        const content = args.slice(2).join(" ");

        if (!mode || !content) {
            return api.sendMessage("⚠️ Dùng lệnh như sau: `morse <mahoa|giaima> <văn bản>`", message.threadID);
        }

        let result: string;
        const modeLower = mode.toLowerCase();

        try {
            if (["encode", "mahoa"].includes(modeLower)) {
                result = encodeToMorse(content);
            } else if (["decode", "giaima"].includes(modeLower)) {
                result = decodeFromMorse(content);
            } else {
                return api.sendMessage("❌ Chế độ không hợp lệ! Dùng `mahoa`, hoặc `giaima` nha.", message.threadID);
            }

            return api.sendMessage(`📡 Kết quả:\n${result}`, message.threadID);
        } catch (err) {
            return api.sendMessage("🚨 Có lỗi xảy ra trong quá trình xử lý Morse!", message.threadID);
        }
    }
} satisfies import("../types").BotCommand;
