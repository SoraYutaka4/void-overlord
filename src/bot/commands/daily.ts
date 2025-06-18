import { isUserError } from "../controllers/usersManager";
import { UserErrorMessages } from "../types/user";
import { isTimePassed } from "../utils";
import axios from "axios";

const events = [
  { topic: "Hôm nay bạn được mẹ cho $5 để ăn sáng", value: 5 },
  { topic: "Đang đi trên đường thì bạn nhặt được $20", value: 20 },
  { topic: "Bạn đang đi trên đường thì nhặt được $10", value: 10 },
  { topic: "Bạn cho một người lạ $1 và được trả ơn lại $100", value: 100 },
  { topic: "Bạn mở hòm kho báu trong mơ và thấy $50, tỉnh dậy vẫn còn tiền trong túi", value: 50 },
  { topic: "Bạn thắng mini game trên Facebook và nhận được $100", value: 100 },
  { topic: "Một người lạ chuyển nhầm vào tài khoản bạn $30", value: 30 },
  { topic: "Bạn giúp cụ già qua đường và cụ lì xì cho bạn $10", value: 10 },
  { topic: "Bạn tìm thấy 1 tờ vé số trúng $250", value: 250 },
  { topic: "Bạn được crush chuyển khoản $2 mua trà sữa", value: 2 },
  { topic: "Bạn nhặt được ví có $100, tìm được chủ và được hậu tạ $20", value: 20 },
  { topic: "Bạn đi học về thì thấy mẹ để lại $10 kèm lời nhắn 'ăn gì thì ăn'", value: 10 },
];

const getRandomEvent = () => {
  const event = events[Math.floor(Math.random() * events.length)];
  return event;
};

export default {
  info: {
    name: "daily",
    description: "Nhận tiền thưởng mỗi 1 giờ",
    version: "1.1.0",
    prefix: true,
    usage: "daily",
    example: "daily",
    category: ["Game"],
    credits: "NPK31"
  },

  execute: async ({api, message, manager}) =>{
    try {
      let res = await axios.get(`http://localhost:8000/api?id=${message.senderID}&normal=true`);
      const data = JSON.parse(res.data.DT_Daily);

      if (!isTimePassed(data.M, data.d, data.h, data.m, data.s)) {
        return api.sendMessage("❌ Bạn đã nhận thưởng rồi! Quay lại sau nhé.", message.threadID);
      }

      const event = getRandomEvent();

      if (!(res.status >= 200 && res.status < 300)) {
        return api.sendMessage("❌ Đã có lỗi xảy ra, vui lòng thử lại!", message.threadID);
      }

      res = await axios.patch("http://localhost:8000/api", {
        id: message.senderID,
        method: "DT_Daily"
      });

      if (!(res.status >= 200 && res.status < 300)) {
        return api.sendMessage("❌ Đã có lỗi xảy ra, vui lòng thử lại!", message.threadID);
      }

      const user = await manager.users.getUserByID(message.senderID);

      if (isUserError(user)) return api.sendMessage(UserErrorMessages.vi[user], message.threadID);

      await manager.users.updateUser(message.senderID, "balance", event.value);

      api.sendMessage(
        `📌 ${event.topic}\n💸 Bạn nhận được: ${event.value.toLocaleString()}$`,
        message.threadID
      );

    } catch (err) {
      console.error("❌ Lỗi tại daily command:", err);
      api.sendMessage("⚠️ Có lỗi xảy ra khi xử lý lệnh. Vui lòng thử lại sau!", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
