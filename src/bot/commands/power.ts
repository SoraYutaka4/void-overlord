import { isUserError } from "../controllers/usersManager";
import { handlePowerAction, PowerAction } from "../game/rpg";
import { API, CM, ParsedMessage, CommandMessage, IFCAU_User } from "../types";
import { User } from "../types/user";

const actions = ["dashboard", "gacha", "equip", "power", "bag"] as const;
const skillTypes = ["fight", "defense", "special"] as const;

type SkillType = typeof skillTypes[number];
type SkillRank = "N" | "R" | "SR" | "SSR";
type PowerActionWithoutPVP = Exclude<PowerAction, "pvp">;

type ParamsRequest = {
  avt?: string;
  rank?: SkillRank;
  page?: number;
  type?: SkillType;
  index?: number;
  slot?: 1 | 2 | 3 | 4 | 5;
};

const validRanks: SkillRank[] = ["N", "R", "SR", "SSR"];

function isValidRank(rank: SkillRank): rank is SkillRank {
  return validRanks.includes(rank);
}

const isValidRankRegex = new RegExp(`^r=(${validRanks.join("|")})$`);
const isValidSkillRegex = new RegExp(`^r=(${skillTypes.join("|")})$`);

function calculateDeduction(rank: SkillRank): number {
  const deductions: Record<SkillRank, number> = {
    N: 100,
    R: 10 ** 4,
    SR: 10 ** 6,
    SSR: 10 ** 8,
  };
  return deductions[rank];
}

interface ParamConfig {
  name: string;      
  alias?: string;      
  type: "string" | "number";  
  required: boolean;  
  regex?: RegExp;  
}

const paramConfigs: Record<PowerActionWithoutPVP, ParamConfig[]> = {
  dashboard: [], // Không có tham số
  bag: [
    { name: "type", alias: "t", type: "string", required: false },
    { name: "page", alias: "p", type: "number", required: false },
  ],
  gacha: [
    { name: "rank", alias: "r", type: "string", required: true, regex: isValidRankRegex },
  ],
  equip: [
    { name: "index", alias: "i", type: "number", required: true, regex: /^i=(\d+)$/ },
    { name: "page", alias: "p", type: "number", required: true, regex: /^p=(\d+)$/ },
    { name: "slot", alias: "s", type: "number", required: true, regex: /^s=([1-5])$/ },
    { name: "type", alias: "t", type: "string", required: false, regex: isValidSkillRegex },
  ],
  power: [],
};

interface ParseResult<T> {
  params: T | null;
  error?: string;
}

function parseParams<T extends Record<string, any>>(
  args: string[],
  config: ParamConfig[]
): ParseResult<T> {
  const params: Record<string, any> = {};
  const usedIndexes = new Set<number>();

  args = args.slice(1);

  for (const param of config) {
    const argIndex = args.findIndex(arg => arg.startsWith(param.name + "=") || arg.startsWith(param.alias + "="));
    if (argIndex !== -1) {
      const value = args[argIndex].split("=")[1];
      let parsedValue: any = value;
  
      if (param.type === "number") {
        parsedValue = parseInt(value, 10);
        console.log(`Checking ${param.name}: ${value}, parsed as: ${parsedValue}`);
        if (isNaN(parsedValue) && value !== '0') {
          return { params: null, error: `Tham số ${param.name} không phải số hợp lệ` };
        }
      }
  
      params[param.name] = parsedValue;
      usedIndexes.add(argIndex);
    }
  }
  

  let freeIndex = 0;
  for (let i = 0; i < args.length; i++) {
    if (usedIndexes.has(i)) continue;

    const param = config[freeIndex];
    if (!param) break;

    let value: any = args[i];
    console.log(`Checking argument: ${args[i]}, for parameter: ${param.name}`);

    if (param && param.name) {
      if (param.type === "number") {
        value = parseInt(value, 10);
        console.log(`Parsed value for ${param.name}: ${value}`);
        if (isNaN(value) && value !== '0') {
          return { params: null, error: `Tham số ${param.name} không phải số hợp lệ` };
        }
      }
      params[param.name] = value;
      freeIndex++;
    }
  }

  for (const param of config) {
    if (param.required && !(param.name in params)) {
      return { params: null, error: `Thiếu tham số bắt buộc: ${param.name}` };
    }
  }

  return { params: params as T, error: undefined };
}







type GetParamsResult<T> = ParseResult<T>;

const getDashboardParams = (info: IFCAU_User): GetParamsResult<ParamsRequest> => {
  return { params: { avt: info.thumbSrc }, error: undefined };
};

const getBagParams = (args: string[]): GetParamsResult<ParamsRequest> => {
  const inputArgs = args.slice(1);
  let type: SkillType | undefined;
  let page: number | undefined;

  for (const arg of inputArgs) {
    if (!isNaN(Number(arg))) {
      page = Number(arg);
    } else if (skillTypes.includes(arg as SkillType)) {
      type = arg as SkillType;
    }
  }

  return {
    params: {
      avt: "",
      type,
      page,
    },
    error: undefined,
  };
};


const getGachaParams = (args: string[]): GetParamsResult<ParamsRequest> => {
  const paramsResult = parseParams<Pick<ParamsRequest, "rank">>(
    args.slice(1),
    paramConfigs["gacha"]
  );

  if (!paramsResult.params) return paramsResult;

  const rank = (paramsResult.params.rank as string)?.toUpperCase();
  if (!isValidRank(rank as SkillRank)) {
    return { params: null, error: "Rank không hợp lệ" };
  }

  return {
    params: {
      avt: "",
      rank: rank as SkillRank,
    },
    error: undefined,
  };
};

const getEquipParams = (args: string[]): GetParamsResult<ParamsRequest> => {
  const paramsResult = parseParams<
    Pick<ParamsRequest, "index" | "page" | "slot" | "type">
  >(args.slice(1), paramConfigs["equip"]);

  if (!paramsResult.params) return paramsResult;

  const { index, page, slot } = paramsResult.params;
  let type = paramsResult.params.type;

  const missingParams: string[] = [];

  if (index === undefined || isNaN(index)) missingParams.push("index");
  if (page === undefined || isNaN(page)) missingParams.push("page");
  if (slot === undefined || isNaN(slot)) missingParams.push("select");
  if (type === undefined) {
    type = (slot === 1 || slot === 2) ? "fight": 
           (slot === 3 || slot === 4) ? "defense":
           "special";
  }

  if (missingParams.length > 0) {
    return { params: null, error: `Thiếu: ${missingParams.join(", ")}` };
  }

  if (!Number.isInteger(index) || Number(index) < 0) {
    return { params: null, error: "i không hợp lệ (phải là số nguyên dương)." };
  }

  if (!Number.isInteger(page) || Number(page) < 1) {
    return { params: null, error: "p không hợp lệ (phải là số nguyên dương)." };
  }

  if (![1, 2, 3, 4, 5].includes(Number(slot))) {
    return { params: null, error: "s không hợp lệ (phải từ 1 đến 5)." };
  }

  if (!skillTypes.includes(type as SkillType)) {
    return { params: null, error: "t không hợp lệ." };
  }

  return {
    params: {
      avt: "",
      index,
      page,
      slot,
      type: type as SkillType,
    },
    error: undefined,
  };
};





const getParams = (
  action: PowerActionWithoutPVP,
  args: string[],
  info: IFCAU_User,
  api: API,
  message: CommandMessage
): ParamsRequest | null => {
  let paramsResult: GetParamsResult<ParamsRequest>;

  switch (action) {
    case "dashboard":
      paramsResult = getDashboardParams(info);
      break;
    case "bag":
      paramsResult = getBagParams(args);
      break;
    case "gacha":
      paramsResult = getGachaParams(args);
      break;
    case "equip":
      paramsResult = getEquipParams(args);
      break;
    case "power":
      paramsResult = { params: { avt: info.thumbSrc }, error: undefined };
      break;
    default:
      api.sendMessage(
        `❌ Lệnh gì lạ quá tui không hiểu bro... 😵‍💫 
         Kiểm tra lại action xem có đúng không nha!`,
        message.threadID
      );
      return null;
  }

  if (paramsResult.error) {
    api.sendMessage(paramsResult.error, message.threadID);
    return null;
  }
  
  if (paramsResult.params) {
    paramsResult.params.avt = encodeURI(info.thumbSrc);
  }

  return paramsResult.params;
};

  
const getUserInfo = (api: API, userID: string): Promise<Record<string, IFCAU_User>> =>
  new Promise((resolve, reject) => {
    api.getUserInfo(userID, (err, ret) => {
      if (err) reject(err);
      resolve(ret);
    });
});



const createPayload = (
  action: PowerActionWithoutPVP,
  message: CommandMessage,
  params: ParamsRequest
) => {
  const basePayload = { id: message.senderID, avt: params.avt ?? "", img: "true" };

  switch (action) {
    case "dashboard":
    case "bag":
      return { ...basePayload, page: params.page ?? 1, type: params.type };

    case "gacha":
      return { ...basePayload, rank: params.rank ?? "N" };

    case "equip":
      return { 
        ...basePayload, 
        index: params.index, 
        page: params.page, 
        type: params.type,
        slot: params.slot 
      };

    case "power":
      return basePayload;

    default:
      return basePayload;
  }
};

interface GachaValidationResult {
  success: boolean;
  message?: string;
  user?: User;
}

const canProceedGacha = async (
  manager: CM,
  senderID: string,
  rank: SkillRank
): Promise<GachaValidationResult> => {
  if (!isValidRank(rank)) {
    return {
      success: false,
      message: `❌ Rank gì lạ vậy trời?? 🤨 Chỉ có mấy rank này thôi nè: N, R, SR, SSR.
              Nhập lại cho đúng đi chứ đừng troll tui mà 😭`,
    };
  }

  try {
    const user = await manager.users.getUserByID(senderID, true) as User;

    if (isUserError(user)) {
      return {
        success: false,
        message: `⚠️ Ủa, tui kiếm hổng ra bạn trong danh sách user luôn á 😵‍💫.  
                  Đăng ký lại hoặc thử lại sau nha!`,
      };
    }

    if (!user) {
      console.error("[canProceedGacha] User is null or undefined");
      return {
        success: false,
        message: "⚠️ Lỗi hệ thống: Không tìm thấy thông tin người dùng.",
      };
    }

    const balanceNeeded = calculateDeduction(rank);

    if (user.balance < balanceNeeded) {
      return {
        success: false,
        message: `💸 Trời đất ơi! Bạn còn nghèo hơn cả server này nữa á??? 😭  
                  Rank ${rank} cần $${balanceNeeded}, mà bạn chỉ có $${user.balance} thôi...  
                  Đi cày cuốc đi rồi quay lại thử vận may nhé! 🍀`,
      };
    }

    return { success: true, user };
  } catch (err) {
    console.error("[canProceedGacha] Error:", err);
    return {
      success: false,
      message: `⚠️ Gacha bị lỗi rồi trời ơi 😭! Chắc do hệ thống mệt quá, bạn thử lại sau nhe!  
                Còn không thì inbox admin khóc lóc xin fix 🤡`,
    };
  }
};

function isValidAction(action: string): action is PowerActionWithoutPVP {
  return actions.includes(action as PowerActionWithoutPVP);
}

async function handleGacha(api: API, message: CommandMessage, manager: CM, action: PowerActionWithoutPVP, params: ParamsRequest) {
  const rank = params.rank as SkillRank;
  const gachaResult = await canProceedGacha(manager, message.senderID, rank);

  if (!gachaResult.success) {
      return api.sendMessage(gachaResult.message!, message.threadID);
  }

  const payload = createPayload(action, message, params);
  const result = await handlePowerAction(action, payload, message);

  api.sendMessage({
      attachment: [result], avoid: {
          delay: false
      }
  }, message.threadID);
}

function sendMessage(api: API, message: CommandMessage, action: PowerActionWithoutPVP, result: any) {
  const messages: Record<PowerActionWithoutPVP, string | object> = {
      dashboard: { attachment: [result], avoid: { delay: false } },
      bag: { attachment: [result], avoid: { delay: false } },
      gacha: { attachment: [result], avoid: { delay: false } },
      equip: "Thông tin trang bị cập nhật thành công!",
      power: "Sức mạnh của bạn đã được làm mới!",
  };

  const messageToSend = messages[action] || "Action không hợp lệ, thử lại nhé!";
  api.sendMessage(messageToSend, message.threadID);
}

let userCache: Record<string, any> = {};
let requestCount = 0; 

async function getUserInfoWithCache(api: API, senderID: string): Promise<any | null> {
  if (requestCount >= 7) {
    userCache = {}; 
    requestCount = 0;
  }

  if (userCache[senderID]) {
    console.log(`User information for ${senderID} retrieved from cache.`);
    return userCache[senderID];
  }

  try {
    const userInfo = await getUserInfo(api, senderID);
    const info = userInfo[senderID];

    if (!info) {
      console.error("User information not found.");
    }

    userCache[senderID] = info;
    requestCount++;

    console.log(`User information for ${senderID} fetched from API.`);

    return info;
  } catch (error) {
    console.error("Error fetching user information:", error);
    return null;
  }
}

export function removeDiacritics(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const actionAlias = {
  dashboard: ["sanh", "xem"],
  bag: ["tui", "ruong"],
  gacha: ["quay", "random"],
  equip: ["trangbi", "nap"],
  power: ["capnhat", "lamtuoi", "update"],
};

function resolveActionAlias(input: string): keyof typeof actionAlias | undefined {
  for (const [key, aliases] of Object.entries(actionAlias)) {
      if (key === input || aliases.includes(input)) {
          return key as keyof typeof actionAlias;
      }
  }
  return undefined;
}

function resolveAliasFromMap(
  input: string,
  aliasMap: Record<string, string[]>
): string | undefined {
  const normalized = removeDiacritics(input.toLowerCase().replace(/\s+/g, ""));
  for (const [key, aliases] of Object.entries(aliasMap)) {
    if (key === normalized || aliases.includes(normalized)) {
      return key;
    }
  }
  return undefined;
}

async function execute(
  {api, message, manager, parsedMessage}
  : {api: API, message: CommandMessage, manager: CM, parsedMessage: ParsedMessage}) {
  try {
      const { senderID, threadID } = message;
      if (!senderID) {
          return api.sendMessage("⚠️ Không tìm thấy ID người gửi.", threadID);
        }
      
      const skillTypesAlias = {
        fight: ["tancong", "cong"],
        defense: ["phongthu", "thu"],
        special: ["dacbiet", "congthu", "thucong"],
      };

      const args = parsedMessage.args.map(arg => {
        const resolved = resolveAliasFromMap(arg, skillTypesAlias);
        return resolved ?? arg;
      });

      if (args.length < 2) {
          return api.sendMessage(`❗ Sử dụng: /sucmanh <action> [...tham số]. Các action: ${actions.join(", ")}`, threadID);
      }

      const rawAction = args[1];
      const action = resolveActionAlias(removeDiacritics(rawAction.toLowerCase().replace(/\s+/g, "")));

      if (!action || !isValidAction(action)) {
          return api.sendMessage(`❗ Action "${rawAction}" không hợp lệ.`, threadID);
      }

      const userInfo = await getUserInfoWithCache(api, message.senderID);
      if (!userInfo) {
          return api.sendMessage("⚠️ Không tìm thấy thông tin người dùng.", threadID);
      }

      const params = getParams(action, args, userInfo, api, message);
      if (!params) return;

      if (action === "gacha") {
          await handleGacha(api, message, manager, action, params);
          return;
      }

      const payload = createPayload(action, message, params);
      const result = await handlePowerAction(action, payload, message);
      sendMessage(api, message, action, result);


  } catch (error) {
      console.error(`[power] Lỗi khi thực hiện action: ${parsedMessage.args[1]} cho user ${message.senderID}:`, error);
      api.sendMessage("⚠️ Có lỗi xảy ra. Thử lại sau nhé!", message.threadID);
  }
}

const usage = [
  "sucmanh <action> [<tham số>]",
  "Action: xem, tui, gacha, trangbi",
  "Rank gacha: " + validRanks.join(", "),
  "Các loại kỹ năng: tancong, phongthu, dacbiet",
  " ",
  "Ví dụ:",
  "  sucmanh xem",
  "  sucmanh ruong <loại kỹ năng> <trang>",
  "  sucmanh gacha r=<rank>",
  "  sucmanh trangbi i=<STT> p=<trang> s=<slot>",
  " ",
  "Tham số:",
  "      - i: STT trang bị (bắt đầu từ 0)",
  "      - p: Trang (bắt đầu từ 1)",
  "      - s: Slot:",
  "        - 1, 2: Slot trang bị cho kỹ năng tấn công",
  "        - 3, 4: Slot trang bị cho kỹ năng phòng thủ",
  "        - 5: Slot trang bị cho cả kỹ năng tấn công và phòng thủ",
];

const example = [
  "/sucmanh xem",             
  `/sucmanh ruong fight 2`,          
  `/sucmanh ruong defense 1`,
  `/sucmanh gacha r=R`,              
  `/sucmanh gacha r=SSR`,             
  "/sucmanh trangbi i=1 p=2 s=1 (Tấn công)",
  "/sucmanh trangbi i=2 p=1 s=3 (Phòng thủ)",
  "/sucmanh trangbi i=3 p=3 s=5 (Cả hai)",
];


export default {
  info: {
    name: "sucmanh",
    description: "Xem thông tin hoặc nâng cấp sức mạnh 😎💪",
    version: "1.0.0",
    prefix: true,
    aliases: ["sm", "strength", "power", "pw"],
    usage,
    example,
    category: ["Game", "Fun"],
    credits: "NPK31"
  },
  execute
} satisfies import("../types").BotCommand;
