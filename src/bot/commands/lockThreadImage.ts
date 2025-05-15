import axios from "axios";

export default {
  info: {
    name: "event:threadimage",
    description: "Chống thay đổi hình ảnh nhóm",
    version: "1.0.0",
    prefix: false,
    hidden: true,
    credits: "NPK31",
  },

  execute: async ({ api, message, global }) => {
    if (message.type !== "event" || message.logMessageType !== "log:thread-image") return;

    const threadID = message.threadID;
    const imageURL = message.logMessageData?.image?.url;

    if (!imageURL) return;

    if (!imageURL.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i)) {
      return;
    }

    if (!global.lockImageSettings) global.lockImageSettings = {};
    if (!global.lockImageSettings[message.threadID]) global.lockImageSettings[message.threadID] = {};

    if (!global.lockImageSettings?.[message.threadID]?.isLock || !global.lockImageSettings[message.threadID]?.image) {
      return;
    }

    const { image } = global.lockImageSettings[message.threadID];

    if (image !== imageURL) {
      try {
        const imgStream = (await axios.get(image, { responseType: "stream" })).data;
        await api.changeGroupImage(imgStream, threadID);
        await api.sendMessage("Phát hiện sửa ảnh! 🚫 Cấm chỉnh sửa, trả lại nguyên bản!", threadID);
        console.log(`🔒 Hình ảnh không hợp lệ đã bị xóa: ${imageURL}`);
      } catch (err) {
        console.error("❌ Lỗi khi xử lý hình ảnh trong nhóm:");
      }
    } else {
      console.log(`🔄 Hình ảnh hợp lệ đã được tải lên: ${imageURL}`);
    }
  },
} satisfies import("../types").BotEvent;