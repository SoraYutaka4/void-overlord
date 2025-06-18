import Together from "together-ai";
import { get_API_Key } from "../../key";

export default {
  info: {
    name: "suthatthuvi",
    description: "Tìm hiểu 7749 sự thật sốc óc mà có thể bạn chưa biết 🤯",
    version: "1.0.0",
    prefix: true,
    rules: {
        balance: 1000
    },
    category: "Fun",
    credits: "NPK31",
    aliases: ["funfact"]
  },

  execute: async ({ api, message, manager }) => {
    try {
        const cooldownCheck = manager.cooldowns.isOnCooldown(message.senderID, "funfact");
        if (cooldownCheck.onCooldown) {
            const remaining = (cooldownCheck.remaining / 1000).toFixed(1);
            return api.sendMessage(`⏳ Bạn phải chờ thêm ${remaining}s nữa mới được xài lệnh này nha!`, message.threadID);
        }

        const prompt = `Cho tôi đúng 1 câu sự thật thú vị, ngắn gọn, không giải thích, không vòng vo. Trả lời trực tiếp, chỉ 1 câu. (Tiếng Việt)`;
        
        const apiKeys = get_API_Key("TOGETHER_API_KEY");

        if (!apiKeys?.length || apiKeys.length < 2){
          throw new Error("[TOGETHER_API_KEY] Missing Together API Keys.");
        }

        const together = new Together({ apiKey: apiKeys[0] });
        const response = await together.chat.completions.create({
            model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free", 
            messages: [
                { role: "system", content: "Bạn là một người chuyên chia sẻ sự thật thú vị, ngắn gọn, hấp dẫn." },
                { role: "user", content: prompt }
            ],
            temperature: 0.9,
            max_tokens: 100,
        });
    
        const funFact = response.choices?.[0]?.message?.content?.trim();
    
        if (!funFact) {
            return api.sendMessage("😢 Không lấy được sự thật thú vị lúc này, thử lại sau nha.", message.threadID);
        }
    
        manager.cooldowns.setCooldown(message.senderID, "funfact", 15000);

        return api.sendMessage({body: `${funFact}`, avoid: { obfuscate: false }}, message.threadID);
    } catch (err) {
      console.error("Lỗi gọi Together AI:", err);
      return api.sendMessage("❌ Đã xảy ra lỗi khi lấy dữ liệu từ AI.", message.threadID);
    }
  }
  
} satisfies import("../types").BotCommand;