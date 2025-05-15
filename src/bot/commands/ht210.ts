import { hasItemInInventory, userDataCache as UDC } from "../utils/command";

const link = [
    "Kanojo face the animation",
    "Mankitsu happening",
    "Onaho kyoushitsu joshi zenin ninshin keikaku",
    "Overflow",
    "Baka Na Imouto Wo Rikou Ni Suru No Wa Ore No XX Dake Na Ken Ni Tsuitre",
    "Yari Agari 1",
    "Gakuen de Jikan yo Tomare",
    "Imouto wa gal kawaii",
]

export default {
  info: {
    name: "haiten",
    description: "🐈👤👀😈", 
    version: "1.0.0",
    prefix: true,
    hidden: true,
  },

  execute: async ({api, message, parsedMessage}) =>{
    const args = parsedMessage.args;

    if (!hasItemInInventory(message.senderID, "blackcat_card", 1)) {
      return api.sendMessage("❌ Bạn không đủ điều kiện để xem lệnh này! Cần có *blackcat_card*.", message.threadID);
    }

    if (args[1] === "yes") {
      UDC[message.senderID] = true;
      return api.sendMessage("🎉 Đã xác nhận thành công! Sẵn sàng cho hành động tiếp theo.", message.threadID);
    }

    if (args.slice(1).join(" ") === "link đâu") {
        const randomName = link[Math.floor(Math.random() * link.length)];
        return api.sendMessage(`😵‍💫🤯 Hả? Link đâu không biết luôn.\n Nhưng mà tên này xịn lắm nè:\n${randomName} 💥🔥🚀`, message.threadID);
    }    

    if (!UDC[message.senderID]) {
      return api.sendMessage(
        "======⚠️ **Cảnh báo nguy hiểm!** ⚠️======\n\n🔦 Bạn có chắc muốn thực hiện lệnh này không? \n" +
        "📝 Nhập `haiten yes` để xác nhận và tiếp tục.\n*Lưu ý: Hành động này không thể hoàn tác!*",
        message.threadID
      );
    }

    const contents = [
        "😅 Thôi đi, trưởng thành lên chút đi! Đừng lúc nào cũng như học sinh lớp 9 nữa 😜",
        "😂 Này, đừng mãi ở trong cái thế giới trẻ con nữa nha! Thử bước ra và trưởng thành chút đi! 😎",
        "😆 Ủa, đến giờ trưởng thành chưa? Đừng mãi như học sinh cấp 2 thế, có lẽ đến lúc trưởng thành rồi đấy! 😂",
        "😂 Trưởng thành lên chút đi, bớt coi mấy cái này đi! Không phải lúc nào cũng là thời gian để chơi đâu nha! 😉",
        "⏰ Dậy đi, đừng ngủ mãi nữa! Còn bao nhiêu việc cần làm mà 😜"
    ];
      
    const randomMessage = contents[Math.floor(Math.random() * contents.length)];
    return api.sendMessage(randomMessage, message.threadID);


  },
} satisfies import("../types").BotCommand;
