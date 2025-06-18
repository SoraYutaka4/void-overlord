import { getLeaderboardMoney } from "../controllers/requestToApi";

export default {
  info: {
    name: "daigia",
    description: "Hiển thị bảng xếp hạng ai giàu nhất server",
    version: "1.0.0",
    prefix: true,
    aliases: ["moneyleaderboard", "typhu"],
    cooldown: 7000,
    category: ["Info", "Fun"],
    credits: "NPK31"
  },

  execute: async ({api, message, parsedMessage}) =>{
    try {
      const page = parseInt(parsedMessage.args[1]) || 1;
  
      if (isNaN(page) || page < 1 || !Number.isInteger(page)) {
        return api.sendMessage(
          `❌ Số trang không hợp lệ! Vui lòng nhập số nguyên dương.`,
          message.threadID
        );
      }
  
      const res = await getLeaderboardMoney({ page: page.toString(), img: true }, "stream");
  
      api.sendMessage(
        {
          body: `💰 Bảng xếp hạng đại gia (${page}):`,
          attachment: [res],
        },
        message.threadID
      );

    } catch (err) {
      console.error("❌ Lỗi khi lấy leaderboard:");
      api.sendMessage(
        "⚠️ Không thể tải bảng xếp hạng lúc này. Vui lòng thử lại sau!",
        message.threadID
      );
    }
  }
  
  
} satisfies import("../types").BotCommand;
