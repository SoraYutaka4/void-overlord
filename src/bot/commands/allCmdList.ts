import { CM } from "../types";
import { transformTextWithStyle } from "../utils/styledFont";

const getCommandAndCategory = (manager: CM) => {
    return manager.commands
        .filter((cmd) => {
            return (
                !cmd.hidden &&
                !cmd.disabled &&
                !!cmd.category &&
                cmd.category !== "general"
            );
        })
        .map((cmd) => ({
            name: Array.isArray(cmd.name) ? cmd.name[0] : cmd.name,
            category: Array.isArray(cmd.category) ? cmd.category : [cmd.category]
        }));
};

export default {
    info: {
        name: [
            "tất cả lệnh", "tat ca lenh", "danh sách lệnh", "danh sach lenh",
            "all command", "all cmd", "full lệnh", "full command", "full lenh",
            "full cmd", "all lệnh"
        ],
        description: "Danh sách lệnh",
        hidden: true,
        version: "1.0.0",
        prefix: false,
        credits: "NPK31",
        category: "Admin"
    },

    execute: ({api, message, manager}) =>{
        try {
            const commandCategories = getCommandAndCategory(manager);

            if (commandCategories.length === 0) {
                return api.sendMessage("❌ Oops! Không tìm thấy lệnh nào phù hợp.", message.threadID);
            }

            const vi_categories = {
                General: "Chung",
                Game: "Trò chơi",
                AI: "AI",
                Music: "Âm nhạc",
                Fun: "Giải trí",
                Tool: "Tiện ích",
                Help: "Hỗ trợ",
                Daily: "Nhận thưởng",
                Leaderboard: "Bảng xếp hạng",
                Bank: "Ngân hàng",
                Info: "Thông tin",
            };

            const categoryList: Record<string, string[]> = {};
            for (const cmd of commandCategories) {
                for (const cat of cmd.category) {
                    if (!categoryList[cat]) categoryList[cat] = [];
                    categoryList[cat].push(cmd.name);
                }
            }

            let response = "";
            for (const [category, commands] of Object.entries(categoryList)) {
                const commandCount = commands.length;
                const viName = vi_categories[category as keyof typeof vi_categories] || category;
                const categoryTitle = `${viName} (${commandCount} lệnh)`;

                const separatorLength = 26;
                const sideLength = Math.max((separatorLength - 2 - categoryTitle.length) / 2, 0);
                const separator = `ミ★${"=".repeat(sideLength)}${transformTextWithStyle(categoryTitle, "boldItalicSansSerif")}${"=".repeat(sideLength)}★彡`;

                const commandList = commands.map(cmd => ` ╰┈➤ ${cmd}`).join("\n");
                response += `${separator}\n${commandList}\n\n`;
            }

            return api.sendMessage(response.trim(), message.threadID);
        } catch (err) {
            console.error("[all-command] error:", err);
            return api.sendMessage("⚠️ Đã xảy ra lỗi khi lấy danh sách lệnh.", message.threadID);
        }
    },
} satisfies import("../types").BotCommand;
