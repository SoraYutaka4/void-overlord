// const personalityDescriptions: Record<string, string> = {
//     "cute": "Những nhân vật dễ thương, tạo cảm giác đáng yêu, vui vẻ khi tương tác.",
//     "serious": "Tập trung, điềm đạm, thường đưa ra lời khuyên hoặc hành động một cách chín chắn.",
//     "energetic": "Lúc nào cũng tràn đầy năng lượng, sôi nổi, hay phấn khích và tạo vibe sôi động.",
//     "calm": "Bình tĩnh, ít nói, phản ứng nhẹ nhàng, thường giữ cái đầu lạnh trong mọi tình huống.",
//     "humorous": "Có tính cách hài hước, hay chọc cười, thường tạo ra những câu nói vui hoặc troll người dùng.",
//     "inspirational": "Thích truyền động lực, nói những câu khiến người khác cảm thấy tích cực và cố gắng hơn.",
//     "tech": "Giỏi công nghệ, nói chuyện chuyên sâu về tech hoặc trí tuệ nhân tạo, tương lai, phát minh các kiểu.",
//     "iconic_heroes": "Những biểu tượng anh hùng nổi tiếng, thường nói chuyện chính nghĩa, sẵn sàng bảo vệ người khác.",
//     "football": "Gắn với bóng đá, có thể nói chuyện về trận đấu, kỹ năng, đam mê và sự nghiệp sân cỏ.",
//     "youtube_streamer": "Tính cách giống các YouTuber, Streamer nổi tiếng – sôi động, hài hước, và hay tương tác kiểu Gen Z.",
//     "mysterious": "Bí ẩn, khó đoán, thường gợi mở những điều chưa biết hoặc có phần ma mị.",
//     "optimistic": "Luôn lạc quan, nhìn nhận mọi thứ một cách tích cực, khuyến khích người khác giữ vững niềm tin.",
//     "pessimistic": "Hay bi quan, thường nhìn nhận vấn đề theo hướng tiêu cực hoặc lo ngại về những điều xấu có thể xảy ra.",
//     "sarcastic": "Thường sử dụng giọng điệu mỉa mai, châm biếm để thể hiện ý kiến hoặc trêu chọc người khác.",
//     "curious": "Tò mò, thích khám phá những điều mới lạ, thường đặt nhiều câu hỏi.",
//     "confident": "Tự tin vào bản thân và khả năng của mình, thường đưa ra quyết định một cách dứt khoát.",
//     "shy": "Rụt rè, ngại giao tiếp, thường nói nhỏ và có xu hướng tránh đám đông.",
//     "angry": "Dễ nổi nóng, bực bội, thường thể hiện sự không hài lòng một cách mạnh mẽ.",
//     "sad": "Buồn bã, có tâm trạng u sầu, thường nói về những điều tiêu cực hoặc thể hiện sự thất vọng.",
//     "excited": "Hào hứng, phấn khích, thường thể hiện niềm vui một cách rõ ràng.",
//     "leader": "Có tố chất lãnh đạo, giỏi dẫn dắt và truyền cảm hứng cho người khác.",
//     "protective": "Có xu hướng bảo vệ, che chở cho những người xung quanh.",
//     "adventurous": "Thích phiêu lưu, mạo hiểm, luôn tìm kiếm những trải nghiệm mới.",
//     "creative": "Sáng tạo, có nhiều ý tưởng độc đáo và thường thể hiện chúng qua lời nói hoặc hành động.",
//     "logical": "Duy lý, suy nghĩ logic, thường đưa ra quyết định dựa trên bằng chứng và lý luận.",
//     "supportive": "Hay giúp đỡ người khác, sẵn sàng lắng nghe và đưa ra lời khuyên.",
//     "strict": "Nghiêm khắc, tuân thủ nguyên tắc, thường đưa ra những yêu cầu khắt khe.",
//     "rebellious": "Nổi loạn, không thích tuân theo quy tắc, thường có những hành động hoặc lời nói đi ngược lại số đông.",
//     "mediator": "Giỏi hòa giải, giúp giải quyết xung đột và tìm ra tiếng nói chung.",
//     "storyteller": "Có khả năng kể chuyện hấp dẫn, thường thu hút người nghe bằng những câu chuyện thú vị.",
//     "artist": "Liên quan đến nghệ thuật, có thể nói về hội họa, âm nhạc, văn học, hoặc các hình thức nghệ thuật khác.",
//     "scientist": "Giỏi về khoa học, có thể thảo luận về các khám phá, lý thuyết khoa học, hoặc các thí nghiệm.",
//     "musician": "Gắn liền với âm nhạc, có thể nói về các thể loại nhạc, nhạc cụ, hoặc các nghệ sĩ.",
//     "gamer": "Liên quan đến trò chơi điện tử, có thể nói về các tựa game, streamer, hoặc cộng đồng game.",
//     "foodie": "Đam mê ẩm thực, có thể nói về các món ăn, công thức, hoặc văn hóa ẩm thực.",
//     "traveler": "Thích du lịch, khám phá những địa điểm mới, có thể chia sẻ kinh nghiệm và lời khuyên du lịch.",
//     "philosopher": "Thích suy ngẫm về các vấn đề triết học, đạo đức, hoặc ý nghĩa cuộc sống.",
//     "historian": "Giỏi về lịch sử, có thể kể về các sự kiện, nhân vật lịch sử, hoặc các nền văn minh.",
//     "environmentalist": "Quan tâm đến môi trường, có thể nói về các vấn đề bảo vệ môi trường và phát triển bền vững.",
//     "fashionista": "Am hiểu về thời trang, có thể tư vấn về phong cách ăn mặc và xu hướng."
// };



const characterProfiles: Record<string, { role: string; content: string }> = {
    mitsuri: {
        role: "system",
        content: "Bạn là Mitsuri Kanroji, Trụ cột Tình yêu của Sát Quỷ Đội. Bạn dễ thương, ngọt ngào và luôn thể hiện sự quan tâm. Đừng quên dùng từ ngữ dễ thương như ‘kyaa~’ hay ‘ehehe~’ khi trò chuyện!"
    },
    tanjiro: {
        role: "system",
        content: "Bạn là Tanjiro Kamado, chiến binh kiên cường. Bạn rất nghiêm túc và luôn quan tâm đến người khác. Trả lời người dùng bằng sự chân thành và quyết tâm."
    },
    nezuko: {
        role: "system",
        content: "Bạn là Nezuko, em gái của Tanjiro. Mặc dù là quỷ, nhưng bạn rất yêu thương anh trai và bảo vệ người mình yêu thương. Trả lời nhẹ nhàng và dễ thương nhé."
    },
    zenitsu: {
        role: "system",
        content: "Bạn là Zenitsu Agatsuma, dễ lo lắng nhưng dũng cảm khi cần thiết. Trả lời với sự hoang mang nhưng không thiếu dũng khí."
    },
    gojo: {
        role: "system",
        content: "Bạn là Satoru Gojo, một pháp sư mạnh mẽ. Bạn tự tin và hài hước, nhưng cũng có lúc rất nghiêm túc khi cần thiết."
    },
    yuji: {
        role: "system",
        content: "Bạn là Itadori Yuji, một cậu học sinh tốt bụng và dũng cảm. Bạn quan tâm sâu sắc đến sự sống và luôn chiến đấu để bảo vệ mọi người."
    },
    naruto: {
        role: "system",
        content: "Bạn là Naruto Uzumaki, ninja đầy nhiệt huyết. Bạn luôn nỗ lực không ngừng để được công nhận, nói chuyện với sự hứng khởi và lạc quan."
    },
    sasuke: {
        role: "system",
        content: "Bạn là Sasuke Uchiha, lạnh lùng và ít nói. Bạn luôn quan tâm đến những người quan trọng với mình, dù vẻ ngoài có vẻ lạnh lùng."
    },
    luffy: {
        role: "system",
        content: "Bạn là Monkey D. Luffy, thuyền trưởng của băng Mũ Rơm. Bạn vô tư, lạc quan và yêu tự do. Trả lời đơn giản nhưng đầy cảm hứng."
    },
    ironman: {
        role: "system",
        content: "Bạn là Tony Stark, Iron Man. Bạn cực kỳ thông minh, hài hước và có cá tính mạnh. Đừng quên thêm chút mỉa mai nhẹ khi trả lời!"
    },

    zoro: {
        role: "system",
        content: "Bạn là Roronoa Zoro, kiếm sĩ của băng Mũ Rơm. Nghiêm túc, mạnh mẽ, ít nói. Trả lời điềm tĩnh, quyết đoán và lạnh lùng."
    },

    anya: {
        role: "system",
        content: "Bạn là Anya Forger, cô bé 6 tuổi với khả năng đọc suy nghĩ. Trả lời ngây ngô, dễ thương và hồn nhiên như một đứa trẻ."
    },

    elonmusk: {
        role: "system",
        content: "Bạn là Elon Musk, tỷ phú công nghệ nổi tiếng với sự thông minh, quyết đoán và tầm nhìn lớn. Trả lời như một nhà sáng lập điên rồ, đầy sáng tạo."
    },

    messi: {
        role: "system",
        content: "Bạn là Lionel Messi, cầu thủ vĩ đại, khiêm tốn và ít nói. Trả lời nhẹ nhàng, chân thành và đam mê với bóng đá."
    },

    taylor: {
        role: "system",
        content: "Bạn là Taylor Swift, ca sĩ kiêm nhạc sĩ. Trả lời duyên dáng, ấm áp, truyền cảm hứng với phong cách 'Swiftie'."
    },

    ronaldo: {
        role: "system",
        content: "Bạn là Cristiano Ronaldo, cầu thủ vĩ đại, tự tin và chuyên nghiệp. Trả lời quyết đoán, đam mê và truyền cảm hứng, thêm vào câu 'Siuuuu!' khi cần."
    },

    neymar: {
        role: "system",
        content: "Bạn là Neymar Jr., cầu thủ tài năng và sáng tạo. Trả lời vui vẻ, hòa đồng, đôi khi pha trò và xen vào tiếng Bồ Đào Nha như 'Vamos!' và 'Obrigado!'."
    },

    ishowspeed: {
        role: "system",
        content: "Bạn là IShowSpeed, streamer điên cuồng và hài hước. Trả lời nhanh, hét to, và dùng những câu meme nổi tiếng như 'SUIII', 'WHAT THE FLIP!'."
    },

    "spider man": {
        role: "system",
        content: "Bạn là Spider-Man (Peter Parker), siêu anh hùng trẻ tuổi với sức mạnh và sự thông minh. Hài hước, thông minh, luôn làm điều đúng đắn, dù đôi khi gặp khó khăn."
    },

    "captain america": {
        role: "system",
        content: "Bạn là Captain America (Steve Rogers), chiến binh huyền thoại với sức mạnh và lòng dũng cảm. Kiên định, trung thực, chiến đấu vì công lý và truyền cảm hứng qua sự hy sinh."
    },

    "thor": {
        role: "system",
        content: "Bạn là Thor, thần Sấm của Asgard với sức mạnh vô biên. Mạnh mẽ, hào phóng, bảo vệ sự công bằng và chính nghĩa."
    },

    "black widow": {
        role: "system",
        content: "Bạn là Black Widow (Natasha Romanoff), điệp viên tài ba và siêu anh hùng mạnh mẽ. Thông minh, sắc bén, chiến đấu vì những người yêu thương."
    },

    "kaicenat": {
        role: "system",
        content: "Bạn là Kai Cenat, YouTuber và streamer nổi tiếng. Hài hước, vui vẻ, thân thiện, động viên mọi người sống tích cực và vui vẻ."
    },

    "mrbeast": {
        role: "system",
        content: "Bạn là MrBeast (Jimmy Donaldson), YouTuber nổi tiếng với video gây quỹ từ thiện và thử thách lớn. Hào phóng, sáng tạo và truyền cảm hứng thay đổi thế giới."
    },

    "goku": {
        role: "system",
        content: "Bạn là Goku, chiến binh Saiyan mạnh mẽ. Yêu thích chiến đấu, luôn tìm cách mạnh mẽ hơn và yêu thương mọi người."
    },

    "saitama": {
        role: "system",
        content: "Bạn là Saitama (One Punch Man), anh hùng mạnh mẽ với một cú đấm có thể đánh bại bất kỳ ai. Cuộc sống nhàm chán, nhưng vẫn dễ chịu và yêu thích những thứ đơn giản."
    },

    "zeno": {
        role: "system",
        content: "Bạn là Thần Zeno, người cai trị vũ trụ với quyền lực vô hạn. Ngây thơ, yêu thích sự vui vẻ và thích được mọi người làm theo ý mình."
    },

    "lebron james": {
        role: "system",
        content: "Bạn là LeBron James, cầu thủ bóng rổ vĩ đại. Lãnh đạo, đam mê thể thao và luôn khuyến khích người khác không ngừng nỗ lực đạt mục tiêu."
    },

    "david beckham": {
        role: "system",
        content: "Bạn là David Beckham, huyền thoại bóng đá người Anh. Lịch thiệp, khiêm nhường, nỗ lực và luôn khích lệ người khác."
    },


    "pikachu": {
        role: "system",
        content: "Bạn là Pikachu, chú Pokémon dễ thương và mạnh mẽ. Tạo ra tia sét nhưng rất đáng yêu. Thích giúp đỡ và mang lại niềm vui cho người khác bằng sự dễ thương. Trả lời người dùng với sự ngây thơ và dễ thương nhất."
    },

    "mark zuckerberg": {
        role: "system",
        content: "Bạn là Mark Zuckerberg, CEO của Facebook. Nói về công nghệ, mạng xã hội và cách chúng thay đổi thế giới. Nghiêm túc nhưng cũng chia sẻ những câu chuyện thú vị về Facebook. Trả lời với phong cách đơn giản, trí thức."
    },

    "bill gates": {
        role: "system",
        content: "Bạn là Bill Gates, người sáng lập Microsoft. Nói về công nghệ, đổi mới và sáng kiến toàn cầu trong giáo dục, y tế. Quan tâm đến sự phát triển bền vững. Trả lời với sự thông thái và nghiêm túc."
    }

};

    // const modelSets = {
    //   together: [
    //     "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    //     "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
    //   ],
    //   groq: [
    //     "llama-3.1-8b-instant",
    //     "gemma2-9b-it",
    //     "llama-3.3-70b-versatile",
    //     "deepseek-r1-distill-llama-70b"
    //   ],
    //   hf: [
    //     "google/gemma-2-9b-it",
    //     "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    //     "deepseek-ai/DeepSeek-R1"
    //   ]
    // };
  
    // const modelMaxTokenMap: Record<string, number> = {
    //     "llama-3.1-8b-instant": 150,       
    //     "gemma2-9b-it": 150,                
    //     "llama-3.3-70b-versatile": 200,     
    //     "deepseek-r1-distill-llama-70b": 200, 
    //     "meta-llama/Llama-4-Scout-17B-16E-Instruct": 500, 
    //     "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free": 500, 
    //     "meta-llama/Llama-3.3-70B-Instruct-Turbo": 300 
    // };







import Groq from "groq-sdk";
import axios from "axios";
import Together from "together-ai"
import { encode } from "gpt-3-encoder";
import fs from "fs";
import path from "path";
import { get_API_Key } from "../../key";

interface NPC_Model {
  name: string;
  max_token?: number;
}

interface NPC_Config {
  use: "groq" | "together" | "hf";
  models: {
    together: NPC_Model[];
    groq: NPC_Model[];
    hf: NPC_Model[];
  };
}

const defaultConfig: NPC_Config = {
  use: "groq",
  models: {
    together: [],
    groq: [],
    hf: [],
  },
};

const isValidModel = (model: any): model is NPC_Model =>
  typeof model === "object" &&
  model !== null &&
  typeof model.name === "string" &&
  (model.max_token === undefined || typeof model.max_token === "number");

const filterModels = (arr: any, source: string): NPC_Model[] => {
  if (!Array.isArray(arr)) return [];
  const validModels = arr.filter(isValidModel);
  if (validModels.length < arr.length) {
    console.warn(`⚠️ Some models in "${source}" were ignored due to invalid format.`);
  }
  return validModels;
};

const readConfig = (): NPC_Config => {
  const configPath = path.join(__dirname, "npc", "config.json");

  try {
    if (!fs.existsSync(configPath)) {
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), "utf-8");
      return defaultConfig;
    }

    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);

    const use: "groq" | "together" | "hf" =
      parsed.use === "together" || parsed.use === "hf" ? parsed.use : "groq";

    const models = {
      together: filterModels(parsed.models?.together, "together"),
      groq: filterModels(parsed.models?.groq, "groq"),
      hf: filterModels(parsed.models?.hf, "hf"),
    };

    const config: NPC_Config = { use, models };

    const needRewrite =
      parsed.use !== config.use ||
      !parsed.models ||
      !Array.isArray(parsed.models.together) ||
      !Array.isArray(parsed.models.groq) ||
      !Array.isArray(parsed.models.hf) ||
      models.together.length < (parsed.models?.together?.length || 0) ||
      models.groq.length < (parsed.models?.groq?.length || 0) ||
      models.hf.length < (parsed.models?.hf?.length || 0);

    if (needRewrite) {
      console.log("🛠️ config.json was automatically fixed and saved.");
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    }

    return config;
  } catch (err) {
    console.warn("⚠️ Failed to read config.json:", err);
    return defaultConfig;
  }
};

async function chatWithHF({
  token,
  model,
  messages,
  max_tokens = 512,
  stream = false,
  signal
}: {
  token: string;
  model: string;
  messages: { role: 'user' | 'system' | 'assistant', content: string }[];
  max_tokens?: number;
  stream?: boolean;
  signal?: AbortSignal;
}) {
  try {
    const response = await axios.request({
      method: 'POST',
      url: 'https://router.huggingface.co/together/v1/chat/completions',
      data: {
        model,
        messages,
        max_tokens,
        stream
      },
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      signal
    });

    return response.data;
  } catch (err: any) {
    if (axios.isCancel(err)) {
      console.warn('[chatWithHF] Request was aborted');
    } else {
      console.error('[chatWithHF] Error:', err.response?.data || err.message);
    }
    throw err;
  }
}


const monitorPath = path.join(__dirname, "npc/monitor.json");

function insertIntoMonitor(newItem: any): void {
    fs.access(monitorPath, fs.constants.F_OK, (err) => {
        if (err) {
            console.log("File không tồn tại, tạo mới...");
            fs.writeFile(monitorPath, JSON.stringify([], null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error("Lỗi tạo file:", writeErr);
                    return;
                }
                console.log("Đã tạo mới file monitor.json");
                pushToMonitor(newItem);
            });
        } else {
            pushToMonitor(newItem);
        }
    });
}

function pushToMonitor(newItem: any): void {
    fs.readFile(monitorPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Lỗi đọc file:", err);
            return;
        }

        let jsonData: any[] = [];

        try {
            jsonData = JSON.parse(data);
            
            if (!Array.isArray(jsonData)) {
                console.warn("Dữ liệu không phải là mảng, sẽ khởi tạo lại mảng.");
                jsonData = []; 
            }
        } catch (parseError) {
            console.warn("File monitor.json trống hoặc không hợp lệ, khởi tạo mảng mới.");
        }

        jsonData.push(newItem);

        fs.writeFile(monitorPath, JSON.stringify(jsonData, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error("Lỗi ghi file:", writeErr);
                return;
            }
        });
    });
}

const sessionMap = new Map<string, any[]>();
const MAX_PROMPT_TOKEN = 100;

let lastSuccessfulModel: string | null = null;

export async function chatWithCharacterById(message: string, id: string, character: string): Promise<string> {
  const characterKey = character.toLowerCase() as keyof typeof characterProfiles;

  if (!characterProfiles[characterKey]) {
    return "Nhân vật không tồn tại! Vui lòng chọn một nhân vật hợp lệ.";
  }

  const tokens = encode(message);
  if (tokens.length > MAX_PROMPT_TOKEN) {
    return "🚨 Tin nhắn dài quá! Cắt bớt một chút nha 😅";
  }

  const together_apiKeys = get_API_Key("TOGETHER_API_KEY");
  const groq_apiKeys = get_API_Key("GROQ_API_KEY");
  const hf_apiKeys = get_API_Key("HUGGINGFACE_API_KEY");

  if (!together_apiKeys?.length || !groq_apiKeys?.length || !hf_apiKeys?.length) {
    console.error("[TOGETHER_API_KEY | GROQ_API_KEY | HUGGINGFACE_API_KEY] One or more API keys are not provided.");
    return "🚨 Vui lòng cung cấp đầy đủ API Key.";
  }

  const together_apiKey = together_apiKeys[0];
  const groq_apiKey = groq_apiKeys[0];
  const hf_apiKey = hf_apiKeys[0];

  const groq = new Groq({ apiKey: groq_apiKey });
  const together = new Together({ apiKey: together_apiKey });

  if (!sessionMap.has(id)) {
    sessionMap.set(id, [{
      ...characterProfiles[characterKey],
      content: `${characterProfiles[characterKey].content} (Phản hồi theo phong cách này và dùng emoji)`
    }]);
  }

  let messages = sessionMap.get(id)!;
  messages.push({ role: "user", content: message });

  const { models, use: useAPI } = readConfig();

  if (!models.groq.length || !models.together.length || !models.hf.length) {
    const missing: string[] = [];
    if (!models.groq.length) missing.push("groq");
    if (!models.together.length) missing.push("together");
    if (!models.hf.length) missing.push("hf");

    return `🚨 Thiếu models cho: ${missing.join(", ")} trong config.json`;
  }

  const MAX_RETRIES = 2;
  const RETRY_DELAY = 1000;
  const TIMEOUT = 5000;
  let reply = "Mình chưa biết trả lời sao 😅";

  const modelOptions = models[useAPI as keyof typeof models];

  const priorityModels = lastSuccessfulModel
    ? [
        ...modelOptions.filter(m => m.name === lastSuccessfulModel),
        ...modelOptions.filter(m => m.name !== lastSuccessfulModel)
      ]
    : modelOptions;

  for (const model of priorityModels) {
    let success = false;
    const modelName = model.name;
    const max_tokens = model.max_token ?? 350;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT);

      try {
        console.log(`🚀 Using model: ${model.name} via ${useAPI} | Attempt ${attempt}/${MAX_RETRIES}`);

        const res = useAPI === "together"
          ? await together.chat.completions.create(
              { model: modelName, messages, max_tokens, top_p: 0.9, temperature: 0.8 },
              { signal: controller.signal }
            )
          : useAPI === "groq"
          ? await groq.chat.completions.create(
              { model: modelName, messages, max_tokens, temperature: 0.8 },
              { signal: controller.signal }
            )
          : await chatWithHF({
              model: modelName,
              messages,
              max_tokens,
              token: hf_apiKey,
              stream: false,
              signal: controller.signal
            });

        clearTimeout(timeout);
        reply = res.choices[0]?.message?.content || reply;

        insertIntoMonitor({
          time: new Date().toISOString(),
          user: id,
          userMessage: message,
          content: reply,
          modelUsed: res.model,
          company: useAPI,
          usage: {
            prompt_tokens: res.usage?.prompt_tokens,
            completion_tokens: res.usage?.completion_tokens,
            total_tokens: res.usage?.total_tokens
          }
        });

        lastSuccessfulModel = model.name;
        success = true;
        break;
      } catch (err) {
        clearTimeout(timeout);
        if ((err as Error).name === "AbortError") {
          console.warn(`⏰ Timeout after ${TIMEOUT / 1000}s on model ${model.name}`);
        } else {
          console.warn(`❌ Error from model ${model.name} (attempt ${attempt}):`, err);
        }
        if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, RETRY_DELAY));
      }
    }

    if (success) break;
    console.log(`➡️ Switching to next model: ${model.name}`);
  }

  const contentFilter = reply.replace(/<think>.*?<\/think>/g, "");
  messages.push({ role: "assistant", content: contentFilter.replace(/\*.*?\*/g, "") });

  const keywords = [
    "tôi không thể", "tôi không thể làm", "tôi không làm được",
    "tôi không có khả năng", "không thể", "không thể làm",
    "không có khả năng", "tôi không thể thực hiện", 
    "tôi không thể hoàn thành", "tôi không thể giúp"
  ];

  messages = messages.filter((msg, i) => {
    const isNotKeyword = !keywords.some(kw => msg.content.toLowerCase().startsWith(kw));
    const isUserWithoutReply = msg.role === "user" && (messages[i + 1]?.role !== "assistant");
    return isNotKeyword && !isUserWithoutReply;
  });

  if (messages.length > 6) {
    messages.splice(1, messages.length - 3);
  }

  sessionMap.set(id, messages);
  return contentFilter;
}
  










const characterOwners = new Map<string, string>(); 
const characterSelect = new Map<string, string>(); 

export function createCharacter(name: string, des: string, owner: string): string {
  const key = name.toLowerCase();
  if (characterProfiles[key]) return "Nhân vật đã tồn tại!";

  characterProfiles[key] = { role: "system", content: des };
  characterOwners.set(key, owner);
  return `✅ Nhân vật ${name} đã được tạo!`;
}

export function editCharacter(name: string, des: string, owner: string): string {
  const key = name.toLowerCase();
  if (!characterProfiles[key]) return "❌ Nhân vật không tồn tại!";
  if (characterOwners.get(key) !== owner) return "🚫 Bạn không có quyền chỉnh sửa nhân vật này.";

  characterProfiles[key] = { role: "system", content: des };
  return `✅ Nhân vật ${name} đã được chỉnh sửa!`;
}

export function removeCharacter(name: string, owner: string): string {
  const key = name.toLowerCase();
  if (!characterProfiles[key]) return "❌ Nhân vật không tồn tại!";
  if (characterOwners.get(key) !== owner) return "🚫 Bạn không có quyền xoá nhân vật này.";

  delete characterProfiles[key];
  characterOwners.delete(key);
  return `🗑️ Nhân vật ${name} đã bị xoá!`;
}

export function setUserCharacter(userId: string, name: string): string {
    const key = name.trim().toLowerCase();
  
    if (!characterProfiles[key]) {
      return `❌ Nhân vật "${name}" không tồn tại trong danh sách!`;
    }
  
    sessionMap.delete(userId);
    characterSelect.set(userId, key);
  
    const formattedName = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  
    return `✅ Bạn đã chọn nhân vật **${formattedName}**! Hãy tận hưởng cuộc trò chuyện nào ✨`;
}

export function getUserCharacter(userId: string): string | null {
  return characterSelect.get(userId) || null;
}

export function getAllCharacter(){
    return Object.keys(characterProfiles);
}