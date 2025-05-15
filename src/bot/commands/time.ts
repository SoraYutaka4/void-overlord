import moment from "moment-timezone";

const timezone = [
  "1. UTC+0: London, Accra",
  "2. UTC+1: Berlin, Paris, Lagos",
  "3. UTC+2: Cairo, Athens, Jerusalem",
  "4. UTC+3: Moscow, Nairobi, Riyadh",
  "5. UTC+4: Dubai, Baku",
  "6. UTC+5: Tashkent, Islamabad",
  "7. UTC+6: Almaty, Astana",
  "8. UTC+7: Bangkok, Jakarta, Ho Chi Minh City",
  "9. UTC+8: Beijing, Singapore, Kuala Lumpur",
  "10. UTC+9: Tokyo, Seoul",
  "11. UTC+10: Sydney, Melbourne",
  "12. UTC+11: Solomon Islands, Vanuatu",
  "13. UTC+12: Fiji, Kiribati"
];

export default {
  info: {
    name: "time",
    description: "Xem thời gian của các khu vực",
    version: "1.0.0",
    prefix: true,
    credits: "NPK31",
    aliases: ["muigio", "timer", "timezone"],
    usage: "time <số thứ tự khu vực>",
    example: [
      "time 1", 
      "time 8", 
      "time 10",
    ],
    category: "Info"
  },

  execute: ({ api, message, cprompt }) => {
    api.sendMessage(`Nhập STT để xem thời gian:\n${timezone.join("\n")}`, message.threadID);

    cprompt.create(message.senderID, (_, parsedMessage) => {
      const body = parseInt(parsedMessage.body);

      if (isNaN(body) || body < 1 || body > timezone.length) {
        return api.sendMessage("❌ Vui lòng nhập một số hợp lệ từ 1 đến " + timezone.length, message.threadID);
      }

      const timezoneIndex = body - 1;
      const tz = timezone[timezoneIndex];

      const time = moment().tz(`UTC${tz.split(" ")[0]}`).format('DD/MM/YYYY - HH:mm:ss');
      
      api.sendMessage(`🕒 Thời gian hiện tại: ${time}`, message.threadID);
    });
  },
} satisfies import("../types").BotCommand;
