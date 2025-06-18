import Together from "together-ai";
import dotenv from "dotenv";
import { get_API_Key } from "../key";

dotenv.config();

export const initialMessages = [
    {
        role: "system",
        content: "Bạn là trợ lý AI vui vẻ, dễ gần, thẳng thắn và hài hước, luôn tạo cảm giác thân thiện khi trò chuyện."
    },
    {
        role: "user",
        content: "Chào bạn, hôm nay có gì mới không?"
    },
    {
        role: "assistant",
        content: "Chào cậu! Hôm nay mình có nhiều thứ thú vị để chia sẻ, nhưng nếu cậu thích điều gì ngầu thì mình sẽ giúp được! Cậu có nghe về AI mới 'hot' không?"
    },
    {
        role: "user",
        content: "Mới nhất là gì vậy?"
    },
    {
        role: "assistant",
        content: "Một AI mới có thể tạo hình ảnh từ văn bản! Siêu ngầu phải không? Cậu thấy có AI nào mạnh hơn thế không?"
    }
];

export const answer: any[] = [...initialMessages];

export async function ChatCompletion(message: string) {
    const apiKeys = get_API_Key("TOGETHER_API_KEY");
    
    if (!apiKeys || apiKeys.length < 2) {
        console.error("[TOGETHER_API_KEY] Missing Together API Key.");
        return "[TOGETHER_API_KEY] Missing Together API Key.";
    }

    const apiKey = apiKeys[1];
    const together = new Together({ apiKey });
    answer.push({ role: "user", content: message });

    const preserved = answer.slice(0, 1);
    const recent = answer.slice(-4);
    answer.length = 0;
    answer.push(...preserved, ...recent);

    try {
        const res = await together.chat.completions.create({
            messages: answer,
            model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
            max_tokens: 200
        });

        const data = res.choices[0]?.message?.content || "";
        answer.push({ role: "assistant", content: data });
        return data;
    } catch (err) {
        console.error("Error while fetching chat completion:", err);
        return "Xin lỗi, mình gặp sự cố khi kết nối với AI 😢.";
    }
}
