import path from "path";
import { UserError } from "../types/user";
import fs from "fs";
import { isUserError } from "../controllers/usersManager";

export default {
  info: {
    name: "--use-bot",
    description: "Đăng ký sử dụng bot",
    version: "1.0.0",
    prefix: false,
    aliases: ["--su-dung-bot", "--sd-bot", "--dangky"],
    hidden: true,
    offline: true,
    category: "Start",
    credits: "NPK31"
  },

  execute: async ({api, message, manager}) =>{
    try {
      const user = await manager.users.getUserByID(message.senderID, true);
      if (!isUserError(user)) return api.sendMessage("🛑 Đăng ký rồi mà cứ nhấn hoài? Chill đi bro 😎", message.threadID);

      api.getUserInfo(message.senderID, async (err, ret) => {
        if (err) {
          console.error("Error fetching user info:", err);
          api.sendMessage("Oops! Có vẻ như mình không thể lấy thông tin người dùng. Kiểm tra lại kết nối xem nào 👀", message.threadID);
          return;
        }

        if (!ret || !ret[message.senderID]) {
          api.sendMessage("Không tìm thấy người dùng đâu, bạn có chắc là mình tồn tại không? 😅", message.threadID);
          return;
        }

        const userInfo = ret[message.senderID]; 

        if (userInfo) {
          const user = await manager.users.createUser(message.senderID, userInfo.name, userInfo.firstName);

          if (typeof user === "number") {
            switch (user) {
              case UserError.INVALID_DATA:
                api.sendMessage("Dữ liệu không hợp lệ nha, check lại thử đi! 😜", message.threadID);
                break;
              case UserError.USER_EXISTS:
                api.sendMessage("Ôi thôi, người dùng đã có rồi! Bạn là người thứ hai á? 😏", message.threadID);
                break;
              case UserError.CREATE_FAILED:
                api.sendMessage("Lỗi hệ thống rồi! Để mình thử lại, đừng lo. 🤔", message.threadID);
                break;
              case UserError.UNKNOWN_ERROR:
                api.sendMessage("Chắc chắn là có gì đó siêu bí ẩn đang xảy ra, để mình kiểm tra lại xem 😱", message.threadID);
                break;
              default:
                api.sendMessage("Có lỗi không xác định xảy ra... Gọi 911 đi mọi người! 😬", message.threadID);
                break;
            }
            return;
          }

          const welcomeMessages = [
            `Chào mừng ${userInfo.name}! Bạn đã chính thức trở thành một phần của thế giới bot rồi! 🎉`,
            `Hé lô ${userInfo.name}~ Bot rất vui vì có bạn đồng hành! 💖`,
            `Boom! ${userInfo.name} vừa hạ cánh vào thế giới siêu cấp của bot! 🛬✨`,
            `${userInfo.name}, bạn chính là mảnh ghép còn thiếu của đại gia đình này! 🧩`,
            `Xin nhiệt liệt chào đón ${userInfo.name} đến với hội những người chơi hệ bot! 🥳`,
            `${userInfo.name}, cảm ơn vì đã join! Let's vibe together! 🎶`,
            `Wazzup ${userInfo.name}! Đã đến lúc cùng nhau khuấy đảo thế giới bot! 🌍🔥`,
            `🥰 ${userInfo.name}, chào mừng bạn đến nơi chill nhất vũ trụ!`
          ]
          
          const messageBody = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
          
          api.sendMessage({
            body: messageBody,
            attachment: [
              fs.createReadStream(
                path.resolve(
                  manager.publicPath, "gif",
                  `g${Math.floor(Math.random() * 3) + 1}.gif`
                )
              )
            ],
            avoid: {
              delay: false,
              queue: 750
            }
          }, message.threadID)

        } else {
          api.sendMessage("Không có thông tin người dùng đâu nha, bạn đang lạc mất rồi hay sao? 😅", message.threadID);
        }
      });
    } catch (error) {
      console.error("Error during command execution:", error);
      api.sendMessage("Có gì đó không ổn khi thực thi lệnh, để mình xử lý ngay! 💻", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
