import { toggleBot, isActive } from "../utils/command";
import { BotCommand } from "../types";

const define = {
    on: ["bat", "on", "mo"],
    off: ["tat", "off", "dong"],
};

export default {
    info: {
        name: "toggle",
        description: "Bật/tắt (chỉ admin)",
        version: "1.0.0",
        prefix: true,
        aliases: ["tg", "enable"],
        hidden: true,
        permission: "admin",
        category: "Admin",
        credits: "NPK31"
    },

    execute: ({api, message, parsedMessage}) =>{
        const enable = parsedMessage.args[1]?.toLowerCase();

        if (!enable) {
            api.sendMessage("Ủa alo? Bật hay tắt? Nói đại 'on' hoặc 'off' đi cha nội! 🤨", message.threadID);
            return;
        }

        if (!define.on.includes(enable) && !define.off.includes(enable)) {
            api.sendMessage("Từ điển nhà bạn thiếu từ 'on' và 'off' à? Gõ lại đàng hoàng coi! 😤", message.threadID);
            return;
        }

        try {
            const currentStatus = isActive() ? "on" : "off";
            const newStatus = define.on.includes(enable) ? "on" : "off";

            if (currentStatus === newStatus) {
                api.sendMessage(
                    newStatus === "on"
                        ? "Tao dậy rồi mà cứ réo hoài! Để yên tao làm việc đi! 😒"
                        : "Tao ngủ rồi, đừng phá nữa! 😴💤",
                    message.threadID
                );
                return;
            }

            toggleBot(define.on.includes(enable));

            api.sendMessage(
                newStatus === "on"
                    ? "Tao đã thức dậy! Ai gọi đấy? 📢😎"
                    : "Tao đi ngủ đây, đừng spam nữa nha! 💤😴",
                message.threadID
            );
        } catch (error) {
            console.error("Error toggling bot:", error);
            api.sendMessage("Ối dồi ôi, tao lag rồi! Đợi chút tao fix nha... 🛠️🤖", message.threadID);
        }
    },
} satisfies BotCommand;
