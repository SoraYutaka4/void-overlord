import { getWeatherImage } from "../controllers/requestToApi";

const provinces = [
  "Hà Nội", "Hà Giang", "Cao Bằng", "Bắc Kạn", "Tuyên Quang", "Lào Cai", "Điện Biên", "Lai Châu",
  "Sơn La", "Yên Bái", "Hòa Bình", "Thái Nguyên", "Lạng Sơn", "Quảng Ninh", "Bắc Giang", "Phú Thọ",
  "Vĩnh Phúc", "Bắc Ninh", "Hải Dương", "Hải Phòng", "Hưng Yên", "Thái Bình", "Hà Nam", "Nam Định",
  "Ninh Bình", "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình", "Quảng Trị", "Thừa Thiên Huế", "Đà Nẵng",
  "Quảng Nam", "Quảng Ngãi", "Bình Định", "Phú Yên", "Khánh Hòa", "Ninh Thuận", "Bình Thuận", "Kon Tum",
  "Gia Lai", "Đắk Lắk", "Đắk Nông", "Lâm Đồng", "Bình Phước", "Tây Ninh", "Bình Dương", "Đồng Nai",
  "Bà Rịa - Vũng Tàu", "Hồ Chí Minh", "Long An", "Tiền Giang", "Bến Tre", "Trà Vinh", "Vĩnh Long", 
  "Đồng Tháp", "An Giang", "Kiên Giang", "Cần Thơ", "Hậu Giang", "Sóc Trăng", "Bạc Liêu", "Cà Mau"
];

function removeVietnameseTones(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function findProvinceIndex(input: string): number {
  const normalized = removeVietnameseTones(input.toLowerCase());
  const index = provinces.findIndex((province) =>
    removeVietnameseTones(province.toLowerCase()).includes(normalized)
  );
  return index !== -1 ? index + 1 : -1; 
}

export default {
  info: {
    name: "thoitiet",
    description: "Xem thời tiết tại tỉnh thành (có hình ảnh).",
    version: "1.0.0",
    prefix: true,
    aliases: ["weather"],
    usage: "[tên tỉnh/thành phố]",
    example: "thoitiet hà nội",
    cooldown: 7000,
    category: ["Info", "Fun"],
    credits: "NPK31"
  },

  execute: async ({api, message, parsedMessage}) =>{
    try {
      const args = parsedMessage.args.slice(1);
      let cityIndex = 44; 
      let provinceName = "";

      if (args.length > 0) {
        provinceName = args.join(" ");
        const foundIndex = findProvinceIndex(provinceName);
        if (foundIndex === -1) {
          return api.sendMessage(
            `❌ Không tìm thấy tỉnh thành "${provinceName}" nha!`,
            message.threadID
          );
        }
        cityIndex = foundIndex;
      }

      const weatherImage = await getWeatherImage(cityIndex, true, "stream");

      api.sendMessage(
        {
          // body: `🌤️ Thời tiết tại **${provinces[cityIndex - 1]}** nè!`,
          attachment: [weatherImage],
        },
        message.threadID
      );
    } catch (error) {
      console.error("❌ Error fetching weather image:", error);
      api.sendMessage("⚠️ Không thể lấy thông tin thời tiết lúc này.", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
