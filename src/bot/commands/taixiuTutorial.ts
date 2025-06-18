export default {
  info: {
    name: "taixiu",
    description: "Chơi tài xỉu cực cuốn 🥵",
    version: "1.1.0",
    prefix: true,
    usage: "tai <số tiền>\n xiu <số tiền>",
    example: "tai 100\nxiu 100",
    aliases: ["tx"],
    rules: {
      balance: 1,
    },
    category: ["Fun", "Game"],
    credits: "NPK31"
  },

  execute: async ({api, message}) =>{
    api.sendMessage(
`🎲 Tài Xỉu cực cuốn 🥵
    
💡 Cách chơi:
- Gửi tai <tiền> hoặc xiu <tiền>
- Đoán tổng 3 viên xúc xắc:
• Tài: ≥ 11
• Xỉu: ≤ 10
- Đoán đúng: nhận gấp đôi 💸
- Sai: mất sạch 😔
    
Ví dụ: tai 100`,
      message.threadID
    );
    
  },
} satisfies import("../types").BotCommand;
