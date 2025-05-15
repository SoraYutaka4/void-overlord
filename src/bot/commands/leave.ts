export default {
    info: {
      name: "event:unsubscribe",
      description: "Rời nhóm",
      version: "1.0.0",
      prefix: false,
      hidden: true,
      credits: "NPK31"
    },
  
    execute: async ({ api, message, global }) => {
      try {
        if (!(message.type === "event" && message.logMessageType === "log:unsubscribe") || !global.autoGoodBye) return;
  
        const leftParticipant = message.logMessageData.leftParticipantFbId;
        const threadID = message.threadID;
  
        let name = "Một ai đó";
        try {
          const userInfo = await api.getUserInfo(leftParticipant);
          name = userInfo[leftParticipant]?.name || name;
        } catch (err) {
          console.error("❌ Lỗi lấy thông tin user:", err);
        }
  
        const goodbyeMessages = [
          `👋 Tạm biệt ${name}! Mong một ngày nào đó bạn sẽ quay lại nhé 🥹`,
          `Ôi không! ${name} đã rời nhóm 😭 Chúc bạn may mắn và hạnh phúc nha! 💖`,
          `Sad vibe... ${name} đã out mất rồi 🥲`,
          `Bye bye ${name}! Đừng quên chúng mình nhé 😭💔`,
          `${name} đã out... Để lại cả trời kỷ niệm 😥`,
          `Alo alo, ${name} đã rời nhóm, ai rảnh kể chuyện troll để bớt buồn đi nào 😅`,
          `${name} rời nhóm rồi... nhóm giờ thiếu mất một nhân tố mlem 🤧`,
          `Chia tay không nói một lời, ${name} ơi 🥀`,
          `Tạm biệt ${name}! Hẹn gặp lại ở một group khác nhé 😎`,
          `Đừng quên quay lại chơi nhé ${name}! Group mãi đỉnh ❤️‍🔥`
        ];
  
        const randomMsg = goodbyeMessages[Math.floor(Math.random() * goodbyeMessages.length)];
  
        try {
          // await api.sendMessage(randomMsg, threadID);
        } catch (err) {
          console.error("❌ Lỗi gửi tin nhắn tạm biệt:", err);
        }
  
      } catch (err) {
        console.error("❌ Lỗi xử lý event:unsubscribe:", err);
      }
    },
  } satisfies import("../types").BotEvent;
  