export default {
  info: {
    name: "tungdongxu",
    description: "Tung đồng xu! Đoán xem là úp hay ngửa 🎲",
    version: "1.1.0",
    prefix: true,
    aliases: ["flipcoin", "tungcoin"],
    category: ["Game", "Fun"],
    credits: "NPK31"
  },

  execute: async ({api, message, manager, parsedMessage}) =>{
    const userGuessRaw = parsedMessage.args[1]?.toLowerCase();
    const guessMap: Record<string, "heads" | "tails"> = {
      heads: "heads",
      úp: "heads",
      up: "heads",

      tails: "tails",
      ngửa: "tails",
      nguoc: "tails",
      tail: "tails"
    };

    const result = Math.random() < 0.5 ? "heads" : "tails";
    const userGuess = guessMap[userGuessRaw ?? ""];

    if (!userGuessRaw) {
      return api.sendMessage(`😗 Tung đồng xu mà không đoán gì hết là sao trời?\nGõ: flipcoin heads / tails hoặc úp / ngửa nha!`, message.threadID);
    }

    if (!userGuess) {
      return api.sendMessage(`❌ Đoán kiểu gì lạ vậy trời? Dùng: heads, tails, úp, hoặc ngửa nhé!`, message.threadID);
    }

    const isCorrect = userGuess === result;

    if (isCorrect) {
      try {
        const reward = Math.floor(Math.random() * 5) + 1;
        await manager.users.updateUser(message.senderID, "balance", reward);
      } catch (error) {
        console.error("An error occurred while updating balance:");
        return api.sendMessage("🚨 Có lỗi khi cộng xu. Thử lại sau nha!", message.threadID);
      }
    }

    const resultVN = result === "heads" ? "ÚP" : "NGỬA";

    const messageText = `🪙 Kết quả: ${result.toUpperCase()} (${resultVN})\n${
      isCorrect
        ? "✅ Oke luôn! Đoán đúng, nhận liền vài xu 🤑"
        : "❌ Trật lất rồi 😅, mà thôi hên xui mà, làm ván nữa hong?"
    }`;

    return api.sendMessage(messageText, message.threadID);
  },
} satisfies import("../types").BotCommand;
