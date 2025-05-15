export default {
  info: {
    name: "event:subscribe",
    description: "Chào mừng thành viên mới",
    version: "1.0.0",
    prefix: false,
    hidden: true,
    credits: "NPK31"
  },

  execute: async ({ api, message, global, styleText }) => {
    if (!(message.type === "event" && message.logMessageType === "log:subscribe") || !global.autoWelcome) return;

    const bold = (str: string) => styleText(str, "boldSerif");
  
    const added = message.logMessageData.addedParticipants;
    if (!added || added.length === 0) return;
  
    const names = added.map(p => p.fullName).join(", ");
    const threadID = message.threadID;
  
    const welcomeMessages = [
      `🎉 Chào mừng ${bold(names)} đã tham gia nhóm! Hãy cùng nhau "chill" nào! ✨`,
      `Yo, ${bold(names)} vừa gia nhập! Ai cũng cần một người bạn như bạn đó 💯`,
      `Ayo ${bold(names)}, bạn là ngôi sao mới của nhóm rồi đó! 🌟`,
      `Làm quen với ${bold(names)} nhé! Cùng nhau "vibe" thôi 😎`,
      `${bold(names)} đã vào nhóm rồi! Hãy cùng tạo những kỷ niệm tuyệt vời nhé ✌️`,
    ];
    const randomMsg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  
    try {
      await api.sendMessage({ body: randomMsg }, threadID);
    } catch (err) {
      console.error("❌ Lỗi gửi tin nhắn chào mừng:", err);
    }
  }
  
} satisfies import("../types").BotEvent;
