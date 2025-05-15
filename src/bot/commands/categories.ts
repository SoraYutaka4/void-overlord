import { CM } from "../types";
import { transformTextWithStyle } from "../utils/styledFont";

const getCommandAndCategory = (manager: CM) => {
    return manager.commands
        .filter((cmd) => {
            const isHidden = cmd.hidden && cmd.permission !== "admin";
            return (
                !isHidden &&
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

const normalizeText = (text: string) =>
    text
      .normalize("NFD")                    
      .replace(/[\u0300-\u036f]/g, "")    
      .replace(/\s+/g, "")               
      .toLowerCase();                

export default {
    info: {
        name: "danhmuc",
        description: "Xem các danh mục có sẵn hoặc tìm kiếm theo tên",
        version: "1.1.0",
        prefix: true,
        aliases: ["categories", "category", "lenh", "lệnh"],
        category: "Info",
        usage: "danhmuc [tên danh mục]",
        example: ["danhmuc", "danhmuc giải trí"],
        credits: "NPK31",
        cooldown: 3000
    },

    execute: async ({api, message, manager, parsedMessage}) =>{
        const args = parsedMessage.args;
        const searchCategory = args.slice(1).join(" ").trim().toLowerCase() || null;

        try {
            const commandCategories = getCommandAndCategory(manager);

            if (commandCategories.length === 0) {
                return api.sendMessage("❌ Oops! Đã có sự cố xảy ra.", message.threadID);
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

            if (!searchCategory) {
                const categories = new Set(commandCategories.flatMap(cmd => cmd.category)); 

                let response = "🚀Các danh mục có sẵn:\n";

                const sortedCategories = Array.from(categories)
                    .map(category => ({
                        category,
                        count: commandCategories.filter(cmd => cmd.category.includes(category)).length
                    }))
                    .sort((a, b) => b.count - a.count);
                
                sortedCategories.forEach(({ category, count }) => {
                    const viName = vi_categories[category as keyof typeof vi_categories] || category;
                    response += `ㅤ📚 ${transformTextWithStyle(viName, "boldSansSerif")} (${count} lệnh)\n`;
                });

                return api.sendMessage(response, message.threadID);
            }

            const viToEn = Object.fromEntries(
                Object.entries(vi_categories).map(([en, vi]) => [
                  normalizeText(vi),
                  en
                ])
              );
              
              const searchNormalized = normalizeText(searchCategory);
              const matchedEnCategory = viToEn[searchNormalized] || searchCategory;

            const filteredCategories = commandCategories.filter(cmd =>
                cmd.category.some(cat => normalizeText(cat) === normalizeText(matchedEnCategory))
            );

            if (filteredCategories.length === 0) {
                return api.sendMessage(`❌ Không tìm thấy danh mục: ${searchCategory}`, message.threadID);
            }

            const categoryList = filteredCategories.reduce((acc: Record<string, string[]>, { name, category }) => {
                const mainCategory = category.find((cat) => cat.toLowerCase() === matchedEnCategory.toLowerCase()) ?? category[0];
                if (!acc[mainCategory]) acc[mainCategory] = [];
                if (!acc[mainCategory].includes(name)) {
                    acc[mainCategory].push(name);
                }
                return acc;
            }, {});


            let response = "";
            for (const [category, commands] of Object.entries(categoryList)) {
                if (category.toLowerCase() !== matchedEnCategory.toLowerCase()) continue;
            
                const commandCount = commands.length;
                const viName = vi_categories[category as keyof typeof vi_categories] || category;
                const categoryTitle = `${viName} (${commandCount} lệnh)`;
            
                const separatorLength = 26;
                const sideLength = Math.max((separatorLength - 2 - categoryTitle.length) / 2, 0);
                const separator = `ミ★${"=".repeat(sideLength)}${transformTextWithStyle(categoryTitle, "boldItalicSansSerif")}${"=".repeat(sideLength)}★彡`;
            
                const commandList = commands.map(cmd => ` ╰┈➤ ${cmd}`).join("\n");
                response = `${separator}\n${commandList}`;
            }
            
            if (response.length === 0) return;
            return api.sendMessage(response, message.threadID);

        } catch (error) {
            console.error("Categories command error:", error);
            return api.sendMessage("⚠️ Có lỗi xảy ra khi lấy danh mục. Hãy thử lại sau!", message.threadID);
        }
    },
} satisfies import("../types").BotCommand;
