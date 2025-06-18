export default {
  info: {
    name: "baucua",
    description: "Xoay nhẹ bầu cua, hên xui không đùa 😎🎲",
    version: "1.1.0",
    prefix: true,
    aliases: ["bc"],
    category: ["Game", "Fun"],
    credits: "NPK31"
  },

  execute: ({api, message}) =>{
    const content = `
🎲 Bầu Cua - Hướng Dẫn Nhanh 🎲

1.  Cược: <con_vật> <tiền> ... (ví dụ: tom 50 ga 100)
2.  Kết quả: Lắc 3 xúc xắc (bầu, cua, cá, tôm, nai, gà).
3.  Thắng: Trúng con vật, nhận tiền.
4.  Thua: Mất tiền cược.
`;

    api.sendMessage(content, message.threadID);
  },
} satisfies import("../types").BotCommand;