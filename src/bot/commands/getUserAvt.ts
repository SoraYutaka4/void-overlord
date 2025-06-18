import axios from 'axios';

export default {
  info: {
    name: "cuopavt",
    description: "Cướp Avatar",
    version: "1.0.0",
    prefix: true,
    credits: "NPK31",
    aliases: ["lumavatar", "cuopavatar", "layavatar", "getavatar", "layavt", "lumavt"]
  },

  execute: async ({api, message}) => {
    const mentions = message.mentions;

    if (Object.keys(mentions).length === 0) {
      return api.sendMessage("Vui lòng đề cập đến người dùng mà bạn muốn lấy avatar.", message.threadID);
    }

    const targetUser = Object.keys(mentions)[0];

    try {
      const avatarUrl = `https://graph.facebook.com/${targetUser}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const response = await axios.get(avatarUrl, { responseType: 'stream' });

      api.sendMessage({
        // body: `Đây là avatar của ${mentions[targetUser]}:`,
        attachment: [response.data], 
      }, message.threadID);

    } catch (error) {
      console.error("Error fetching avatar:", error);
      api.sendMessage("Đã có lỗi xảy ra khi lấy avatar.", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
