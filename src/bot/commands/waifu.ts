import { promisify } from "util";
import fs from "fs";
import sharp from "sharp";
import path from "path";

const unlinkAsync = promisify(fs.unlink);

function removeDiacritics(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

type Genre = 'sfw' | 'nsfw';
type SubGenre = keyof typeof genre_vi['sfw'];

function searchGenre(keyword: string): { genre: Genre, subGenre: SubGenre } | null {
  const normalizedKeyword = removeDiacritics(keyword.toLowerCase()).replace(/\s+/g, '');
  for (const genre in genre_vi) {
    for (const subGenre in genre_vi[genre as Genre]) {
      if (subGenre === keyword.toLowerCase().trim()) return { genre: genre as Genre, subGenre: subGenre as SubGenre };
      const keywords: string[] = (genre_vi[genre as Genre] as Record<SubGenre, string[]>)[subGenre as SubGenre].map((kw: string): string =>
        removeDiacritics(kw.toLowerCase()).replace(/\s+/g, '')
      );
      if (keywords.some(kw => kw.startsWith(normalizedKeyword))) {
        return { genre: genre as Genre, subGenre: subGenre as SubGenre };
      }
    }
  }
  return null;
}


const genre_vi = {
  sfw: {
    waifu: ["bạn", "bé", "bạn gái", "crush", "cute", "em", "gái", "gái xinh", "mơ", "nàng", "nữ thần", "thần", "vợ", "vợ ảo", "vợ mơ", "waifu"],
    neko: ["con", "cute", "mèo", "mèo con", "mèo dễ thương", "meow", "mimi", "neko", "tai", "tai mèo"],
    shinobu: ["bé", "chan", "chị", "cute", "shin", "shin chan", "shinobu", "shinobu cute"],
    megumin: ["bé", "boom", "cute", "megu", "megumin", "megumin dễ thương", "nổ", "phù", "phù thủy nổ"],
    bully: ["bắt nạt", "bơ", "cà khịa", "chị đùa", "chị troll", "ghẹo", "khịa", "nạt", "toxic", "troll"],
    cuddle: ["ấp", "cuddle", "khóa", "khóa chặt", "mềm", "ôm", "ôm ấp", "tình", "tình cảm"],
    cry: ["buồn", "chật vật", "khóc", "khổ", "mắt", "mít ướt", "nước mắt", "sụt", "ướt"],
    hug: ["ấm", "chặt", "hug", "nhẹ", "ôm", "ôm nhẹ", "tay", "thân mật", "vòng tay"],
    awoo: ["awoo", "gào", "gái hú", "hú", "sói", "tiếng", "tiếng sói", "tru"],
    kiss: ["hôn", "hun", "hun nhẹ", "kiss", "môi", "nụ hôn", "nụ hôn", "chụt", "yêu"],
    lick: ["đánh lưỡi", "liếm", "liếm nhẹ", "liếm yêu", "lick", "lưỡi", "nhẹ", "ướt", "yêu"],
    pat: ["cưng", "cưng đầu", "đầu", "pat", "ve", "vuốt", "vuốt ve", "xoa", "xoa đầu"],
    smug: ["bơ", "đểu", "kiêu", "kiêu ngạo", "khinh", "mãn", "smug", "tự mãn"],
    bonk: ["bộp", "bonk", "cốc", "cốc đầu", "đập", "đập nhẹ", "gõ", "tát", "tát nhẹ"],
    yeet: ["đi", "ném", "ném đi", "ném mạnh", "phóng", "quăng", "quăng mạnh", "yeet"],
    blush: ["blush", "hồng", "mặt", "mặt đỏ", "ngại", "thẹn", "thẹn thùng", "đỏ", "đỏ mặt"],
    smile: ["cười", "hạnh phúc", "mỉm", "mỉm cười", "rạng", "smile", "tươi", "tươi tỉnh", "vui"],
    wave: ["bye", "chào", "hello", "tay", "vẫy", "vẫy tay", "wave"],
    highfive: ["cao", "đập", "five", "high five", "năm", "tác", "tương tác", "vỗ", "vỗ tay"],
    handhold: ["chỉ", "chỉ tay", "dắt", "dắt tay", "giữ", "nắm", "nắm tay", "siết", "tay", "tay nắm tay"],
    nom: ["ăn", "ăn ngon", "chén", "nom", "nhai", "ngon", "thưởng thức", "xực"],
    bite: ["cắn", "cắn nhẹ", "cắn yêu", "gặm", "bite", "xé", "yêu"],
    glomp: ["ghì", "glomp", "nhào", "nhào tới", "ôm", "ôm chặt", "ôm mạnh", "quấn", "quấn lấy"],
    slap: ["bốp", "đánh", "đập mặt", "mặt", "slap", "tát", "tát mạnh"],
    kill: ["hại", "kill", "mạng", "nguy", "nguy hiểm", "sát", "sát thủ", "giết", "đoạt mạng"],
    kick: ["cước", "đá", "đá đau", "đá mạnh", "kick", "phi cước", "sút"],
    happy: ["hạnh phúc", "hớn", "mừng", "sướng", "tươi", "tươi tỉnh", "vui", "vui vẻ"],
    wink: ["chớp", "chớp mắt", "liếc", "mắt", "nháy", "thả cảm xúc", "thả thính", "wink"],
    poke: ["chọc", "đùa", "nghịch", "nhéo", "poke", "xúc"],
    dance: ["lắc", "nhảy", "quay", "quay cuồng", "quẩy", "vũ", "vũ điệu", "dance"],
    cringe: ["cringe", "hổ", "khó", "ngại", "ngại ngùng", "quê", "quê độ", "xấu hổ", "ớn"]
  },
  nsfw: {
    waifu: ["bồ", "bồ nóng bỏng", "búp", "búp bê 18+", "gái nóng", "hot", "hú", "mlem", "nóng", "quyến", "sexy", "vợ 18+"],
    neko: ["êu", "hot", "mèo", "mèo quyến rũ", "mèo sexy", "meo", "neko", "neko 18+", "neko nóng", "quyến", "tai", "tai mèo nóng"],
    trap: ["cậu", "cậu trai", "em gái", "giả", "giả gái", "trai", "trai giả gái", "trá", "trá hình", "trap"],
    blowjob: ["bj", "bồ", "bồ thổi", "liếm", "mút", "sung", "sung sướng", "thổi", "thổi sung sướng"]
  }
};



import axios from "axios";
import { hasItemInInventory, isAdministrator } from "../VoidOverlord";
const API_BASE = "https://api.waifu.pics";


const getImageStream = async (url: string): Promise<NodeJS.ReadableStream | null> => {
  try {
    const response = await axios.get(url, { responseType: "stream" });
    return response.data;
  } catch (error) {
    console.error(`Error getting image stream: ${error}`);
    return null;
  }
};


const downloadAndProcessImage = async (url: string, blur: number): Promise<string | null> => {
  try {
    const response = await axios.get(url, { responseType: "stream" });
    const outputPath = path.join(__dirname, "cache/generated", `output_${Date.now()}.jpg`);

    let pipeline = sharp();
    if (blur) pipeline = pipeline.blur(blur);

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(pipeline).pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(undefined));
      writer.on("error", reject);
    });

    return outputPath;
  } catch (err) {
    console.error("❌ Lỗi xử lý ảnh bằng stream:", err);
    return null;
  }
};

export default {
  info: {
    name: "waifu",
    description: "Gọi waifu về chill~ 🥰",
    version: "1.0.0",
    prefix: true,
    category: ["Fun"],
    rules: {
      balance: 10000
    },
    credits: "NPK31"
  },

  execute: async ({api, message, manager, parsedMessage}) =>{
    const args = parsedMessage.args.slice(1);
    const blur = parseInt(parsedMessage.query.blur);
    const rawTag = args.join(" ").replace(/blur=\d+/i, "").trim();
    const tag = rawTag || "waifu";
    
    if (!tag) {
      return api.sendMessage("😵‍💫 Êy, bạn chưa nhập thể loại gì hết trơn á!", message.threadID);
    }
  
    const genre = searchGenre(tag);
  
    if (!genre) {
      return api.sendMessage(`🤔 Hông tìm ra thể loại "${tag}" bạn ơi...`, message.threadID);
    }

    if (parsedMessage.query.blur && isNaN(blur)) {
      return api.sendMessage("❌ Blur phải là một số nguyên hợp lệ!", message.threadID);
    }
    
    if (blur < 1 || blur > 700) {
      return api.sendMessage("❌ Blur phải nằm trong khoảng từ 1 đến 700!", message.threadID);
    }

    try {
      const res = await axios.get(`${API_BASE}/${genre.genre}/${genre.subGenre}`, { timeout: 3500 });
      const imgUrl = res.data.url;
  
      if (!imgUrl) {
        return api.sendMessage("😿 Không tìm thấy ảnh nào bạn ơi...", message.threadID);
      }
  
      await new Promise(resolve => setTimeout(resolve, 1750));
      const isNSFW = genre.genre.toLowerCase() === "nsfw";

      await manager.users.updateUser(message.senderID, "balance", -10000);

      if (!isNSFW){
        const imgStream = await getImageStream(imgUrl);

        if (!imgStream) {
          return api.sendMessage("🚫 Ảnh bị lỗi hoặc mạng lag sml nên tải không nổi 😢", message.threadID);
        }

        return api.sendMessage({
          attachment: [imgStream]
        }, message.threadID);
      }

      
      if (!hasItemInInventory(message.senderID, "blackcat_card", 1) && !isAdministrator(message.senderID)) {
        const noBlackcatMessages = [
          "🤔 Bạn không có thẻ blackcat để xem!",
          "😿 Bạn chưa có thẻ blackcat đâu nha~ Mau kiếm một cái đi!",
          "😭 Bạn nghĩ bạn có thẻ blackcat á? Tỉnh lại đi bro.",
          "😼 Không có thẻ mà đòi xài à? Về farm tiếp đi cưng.",
          "💡 Bạn chưa có thẻ blackcat. Thử tham gia nhiệm vụ hằng ngày để kiếm nhé!",
          "🃏 Thiếu mất chiếc thẻ đen huyền thoại rồi... Đi săn nó thôi nào!",
          "🧙‍♂️ Một chiếc thẻ đen kỳ bí là chìa khóa… nhưng bạn lại không có nó.",
        ];

        const randomMsg = noBlackcatMessages[Math.floor(Math.random() * noBlackcatMessages.length)];
        return api.sendMessage(randomMsg, message.threadID);
      }

      const processedPath = await downloadAndProcessImage(imgUrl, isNaN(blur) ? 70: blur);
  
      if (!processedPath) {
        return api.sendMessage("🚫 Lỗi khi xử lý ảnh rồi bạn ơi...", message.threadID);
      }
  
      const readStream = fs.createReadStream(processedPath);

      await api.sendMessage({ attachment: [readStream] }, message.threadID);
      unlinkAsync(processedPath);
  
    } catch (error) {
      console.error("❌ Error during anime command execution:", error);
      return api.sendMessage("❌ Có lỗi xảy ra khi tải ảnh...", message.threadID);
    }
  }
  
} satisfies import("../types").BotCommand;