import { queryAI } from "../controllers/requestToApi";

export default {
    info: {
      name: "hoi",
      description: "Sử dụng AI để trả lời câu hỏi hoặc thực hiện trò chuyện.",
      version: "1.0.0",
      prefix: true,
      aliases: ["chat", "ai", "ask"],
      usage: "hoi [câu hỏi]",
      example: "-ask Bạn có thể giúp tôi gì hôm nay?",
      category: ["Tool"],
      credits: "NPK31"
    },
  
    execute: async ({api, message, parsedMessage}) =>{
        if (parsedMessage.args.length <= 1) {
          api.sendMessage("Bạn cần cung cấp câu hỏi hoặc yêu cầu cho AI.", message.threadID);
          return;
        }

        if (parsedMessage.args.length >= 20) {
          api.sendMessage("Hỏi vừa thôi, đừng làm khó tôi mà 😭", message.threadID);
          return;
        }
        
        const query = parsedMessage.args.slice(1).join(" ");
        
        try {
          const res = await queryAI({ q: query }, "text");
          api.sendMessage({
            body: res,
            avoid: {
              obfuscate: false
            }
          }, message.threadID);
        } catch (error) {
          api.sendMessage("Đã có lỗi xảy ra khi kết nối đến AI. Vui lòng thử lại sau.", message.threadID);
        }
      }
      
  } satisfies import("../types").BotCommand;
  