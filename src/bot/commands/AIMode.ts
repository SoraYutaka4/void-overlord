import Together from "together-ai";
import { get_API_Key } from "../../key";
import { CommandMessage } from "../types";

const systemPrompt = {
  role: "system",
  content: `Bạn là Esdeath: dịu dàng với người yêu, thân thiện với bạn bè.
User bắt đầu tin nhắn như sau:
- Người yêu: [mylove-Tên]: Nội dung 
- Bạn bè: [friend-Tên]: Nội dung 
- Người khác: [Tên]: Nội dung 
Trả lời tự nhiên, không thêm [Tên] vào đầu. Thường xuyên Dùng emoji và lâu lâu xuống dòng.`
};


let answer: any[] = [systemPrompt];

const keywords = [
    "tôi không thể", 
    "tôi không thể làm",
    "tôi không làm được", 
    "tôi không có khả năng", 
    "không thể", 
    "không thể làm",
    "không có khả năng",
    "tôi không thể thực hiện", 
    "tôi không thể hoàn thành", 
    "tôi không thể giúp"
];

function startsWithKeywords(text: string) {
    const lowerText = text.toLowerCase().trim();
    return keywords.some(keyword => lowerText.startsWith(keyword));
}

async function Chat(message: string, name: string) {
  const apiKeys = get_API_Key("TOGETHER_API_KEY");

  if (!apiKeys?.length || apiKeys.length < 2){
    console.error("[TOGETHER_API_KEY] Missing Together API Keys.");
    return;
  }

  const together = new Together({ apiKey: apiKeys[1] });
  
  const isUserLover = name.toLowerCase().startsWith('mylove-');
  const userName = isUserLover ? name.split('-')[1] : name; 
  
  answer.push({ 
    role: "user", 
    content: `[${isUserLover ? `mylove-${userName}` : userName}]: ${message}` 
  });

    const maxTurns = 2;
    const latestMessages = answer.slice(-maxTurns * 2);
    answer = [systemPrompt, ...latestMessages];

    const res = await together.chat.completions.create({
        messages: answer,
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        max_tokens: 200,
    });

    let data = res.choices[0]?.message?.content || "";

    const contentFilter = data
        .replace(/<think>.*?<\/think>/gs, "")
        .trim();

    if (startsWithKeywords(contentFilter)) {
        answer.pop();
        return contentFilter;
    }

    answer.push({ role: "assistant", content: contentFilter.replace(/\*.*?\*/gs, "") });

    return contentFilter.replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, '($1)');
}

function checkBotMention(message: CommandMessage, botId: string) {
  const mentions = message.mentions || {};
  const botName = mentions[botId];

  if (!botName) {
    return { mentioned: false, cleanedBody: message.body };
  }

  const botTagText = `@${botName}`;
  const cleanedBody = message.body.split(botTagText).join('').replace(/\s+/g, ' ').trim();

  return { mentioned: true, cleanedBody };
}


export default {
  info: {
    name: "aimode",
    description: "Chế độ AI",
    version: "1.0.0",
    prefix: true,
    permission: "owner",
    category: "Fun",
    credits: "NPK31",
  },

  execute: async ({ api, message, parsedMessage, global, cprompt, normalizeText, userInfo, inventory }) => {
    try {
      const args = parsedMessage.args;
      const state = normalizeText(args.slice(1).join(" ").toLowerCase());

      if (!global.AIMode) {
        global.AIMode = {};
        return api.sendMessage(`AI mode đã được khởi tạo cho nhóm! 🔥\nNhập -aimode on/off để điều chỉnh.`, message.threadID);
      }

      const threadID = message.threadID;

      if (!global.AIMode[threadID]) {
        global.AIMode[threadID] = { isEnabled: false };
      }

      if (["toggle", "auto", "tudong"].includes(state)) {
        global.AIMode[threadID].isEnabled = !global.AIMode[threadID].isEnabled;
      } else if (["bat", "on"].includes(state)) {
        global.AIMode[threadID].isEnabled = true;
      } else if (["tat", "off"].includes(state)) {
        global.AIMode[threadID].isEnabled = false;
      }

      if (global.AIMode[threadID].isEnabled) {
        const getUserRolePrefix = (userId: string): string => {
          const userInventory = inventory.get(userId) ?? [];
          const roles = new Set(userInventory);
        
          if (roles.has("lover_role")) return "mylove-";
          if (roles.has("friend_role")) return "friend-";
        
          return "";
        }

        const listener = async (message: CommandMessage) => {
          try {
            const botId = api.getCurrentUserID();
            const isSelfMessage = message.senderID === botId;
        
            if (isSelfMessage) {
              return cprompt.create(`event:all:${threadID}`, listener, null);
            }
        
            const { mentioned, cleanedBody } = checkBotMention(message, botId);

            if (!mentioned || cleanedBody.length > 100) {
              return cprompt.create(`event:all:${threadID}`, listener, null);
            }
        
            const body = cleanedBody;
            const namePrefix = getUserRolePrefix(message.senderID);
            const name = namePrefix + (userInfo.firstName || "User");
        
            const result = await Chat(body, name);

            if (!result) return;

            api.sendMessage(result, message.threadID);
        
          } catch (err) {
            console.error("⚠️ Something went wrong in AI Mode listener:", err);
          } finally {
            cprompt.create(`event:all:${threadID}`, listener, null);
          }
        };

        if (!global.AIModeListeners) {
          global.AIModeListeners = {};
        }

        if (!global.AIModeListeners[threadID]) {
          cprompt.create(`event:all:${threadID}`, listener, null);
          global.AIModeListeners[threadID] = listener;
        }

        api.sendMessage("✅ Đã bật AI Mode. Bot sẽ tự động trả lời tin nhắn.", threadID);
      } else {
        if (global.AIModeListeners && global.AIModeListeners[threadID]) {
          cprompt.remove(`event:all:${threadID}`);
          delete global.AIModeListeners[threadID];
        }
        api.sendMessage("❌ Đã tắt AI Mode.", threadID);
      }
    } catch (err) {
      console.error("⚠️ Oops! Error in the aimode command:", err);
      api.sendMessage("❌ Có lỗi xảy ra khi xử lý AI Mode. Vui lòng thử lại sau. 🙁", message.threadID);
    }
  }
} satisfies import("../types").BotCommand;
