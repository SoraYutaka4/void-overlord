export default {
    info: {
      name: "npc",
      description: "Chém gió với nhân vật yêu thích của bạn ✨",
      version: "1.0.0",
      prefix: true,
      category: "Fun",
      aliases: ["character", "nhanvat"],
      credits: "NPK31"
    },
  
    execute: ({api, message, styleText}) =>{
        const instructions = 
`1️⃣ 🔍 ${styleText("Xem nhân vật:", "boldSansSerif")} npc
2️⃣ 🦸‍♂️ ${styleText("Chọn nhân vật:", "boldSansSerif")} npc chọn tên=<tên>
3️⃣ 🗣️ ${styleText("Nói với nhân vật:", "boldSansSerif")} > <nội dung>
        `;
  
      api.sendMessage(instructions, message.threadID);
    },
} satisfies import("../types").BotCommand;
  