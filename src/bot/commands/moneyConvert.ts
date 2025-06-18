import axios from "axios";
import { get_API_Key } from '../../key';

export default {
  info: {
    name: "tiente",
    description: "Chuyển đổi tiền tệ",
    version: "1.0.0",
    prefix: true,
    credits: "NPK31",
    category: "Tool",
    rules: {
        balance: 50
    },
    usage: "<số tiền> <mã tiền từ> <mã tiền đến>",
    example: [
      "tiente 100 USD VND",
      "tiente 25000 JPY EUR",
      "tiente 50 GBP USD"
    ]
  },

  execute: async ({ api, message, parsedMessage, parseAmount }) => {
    const { args } = parsedMessage;
    const amount = parseAmount(args[1] ?? "");
    const from = args[2]?.toUpperCase();
    const to = args[3]?.toUpperCase();

    if (!args[1] || isNaN(amount) || amount <= 0 || !from || !to) {
      return api.sendMessage("💸 Dùng đúng cú pháp: `tiente <số tiền> <from> <to>`", message.threadID);
    }


    try {
      const apiKeys = get_API_Key("exchange");

      if (!apiKeys?.length){
        console.error("[exchange] Missing Exchange API Keys.");
        return;
      }

      const API_KEY = apiKeys[Math.floor(Math.random() * apiKeys.length)];

      const res = await axios.get(`https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${from}/${to}/${amount}`);
      
      if (res.data.result !== "success") throw new Error("API trả lỗi.");

      const result = res.data.conversion_result;
      api.sendMessage(
        `💱 ${amount.toLocaleString()} ${from} = ${result.toLocaleString()} ${to}\n📊 Tỷ giá: ${res.data.conversion_rate}`,
        message.threadID
      );
    } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 400) {
            return api.sendMessage("⚠️ Mã tiền không hợp lệ! Ví dụ: USD, VND, EUR, JPY...", message.threadID);
        }
        api.sendMessage("❌ Không thể chuyển đổi. Kiểm tra mã tiền tệ hoặc API key nha!", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
