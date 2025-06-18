import axios from 'axios';

export default {
  info: {
    name: "ip",
    description: "Xem thông tin của ip",
    version: "1.0.0",
    prefix: true,
    category: ["Info", "Tool"],
    credits: "NPK31"
  },

  execute: async ({ api, message, parsedMessage, styleText }) => {
    const ip = parsedMessage.args[1];
    if (!ip) {
      return api.sendMessage("Vui lòng cung cấp địa chỉ IP để tra cứu.", message.threadID);
    }

    try {
      const response = await axios.get(`http://ip-api.com/json/${ip}`);

      if (response.data.status === 'fail') {
        return api.sendMessage("Không thể tìm thấy thông tin cho IP này.", message.threadID);
      }

      const data = response.data;
      const locationInfo = `
      ${styleText("Thông tin IP", "boldSerif")}:
      - ${styleText("IP", "boldSerif")}: ${data.query}
      - ${styleText("Thành phố", "boldSerif")}: ${data.city}
      - ${styleText("Khu vực", "boldSerif")}: ${data.regionName}
      - ${styleText("Quốc gia", "boldSerif")}: ${data.country}
      - ${styleText("Mã bưu điện", "boldSerif")}: ${data.zip}
      - ${styleText("Tọa độ", "boldSerif")}: ${data.lat}, ${data.lon}
      - ${styleText("Tổ chức", "boldSerif")}: ${data.org}
      - ${styleText("Múi giờ", "boldSerif")}: ${data.timezone}
    `;

      api.sendMessage({body: locationInfo, avoid: {
        obfuscate: false
      }}, message.threadID);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin IP:', error);
      api.sendMessage('Đã có lỗi xảy ra khi lấy thông tin IP.', message.threadID);
    }
  },
} satisfies import("../types").BotCommand;