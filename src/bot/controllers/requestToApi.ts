import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api",
});

// ===== Helper =====
const handleRequest = async (
  request: Promise<any>,
  responseType: "json" | "text" | "stream" | "arraybuffer" = "json"
) => {
  try {
    const res = await request;
    return res.data;
  } catch (err: any) {
    console.error("❌ API Error:", err.response?.data || err.message);
    throw err.response?.data || err.message;
  }
};

export interface IGetUserByNameParams {
  name: string;
  normal?: string;
}

export interface IGetUserByIdParams {
  id: string;
  normal?: string;
}

export interface ICreateUserBody {
  id: string;
  name: string;
  firstName: string;
}

export interface IUpdateUserBody {
  id: string;
  method: string;
  value: number;
  overwrite?: boolean;
}

export interface IGetTracksParams {
  id?: number;
}

export interface IUpdateTracksBody {
  tracks: any[]; // Nếu có cấu trúc track cụ thể thì define luôn.
}

export interface ISearchMusicParams {
  search: string;
  img?: string;
}

export interface IGetMusicInfoParams {
  id: number;
}

export interface IGetMusicAudioParams {
  id: number;
}

export interface IQueryAIParams {
  q: string;
  history?: boolean;
  ui?: boolean;
}

export interface IGetWeatherParams {
  id: number;
}

export interface IGetWeatherImageParams {
  id: number;
  img?: boolean | "true";
}

export interface ICreateSkillBody {
  [key: string]: any; // Nếu bạn có schema cụ thể thì sửa lại chỗ này
}

export interface IDeleteSkillBody {
  id: number;
  sl: number;
}

export interface IGetSkillBagParams {
  id: string;
  check?: boolean;
  fulldata?: boolean;
  type?: string;
}

export interface IDeleteSkillBagParams {
  id: string;
  i: number;
  type: string;
}

export interface IGetPowerDashboardParams {
  id: string;
  avt: string;
  img?: string;
}

export interface IAddSkillToBagBody {
  idSkill: number;
  id: string;
  rank: string;
  method: string;
}

export interface IGetPageSkillParams {
  id: string;
  page: number;
  type?: string;
}

export interface IGetSkillBagImageParams {
  id: string;
  avt: string;
  page: number;
  type?: string;
  img?: string;
}

export interface IRandomSkillParams {
  id: string;
  rank: string;
  probability?: string;
  method?: string;
  percent?: number;
}

export interface IRandomSkillImageParams {
  id: string;
  rank: string;
  avt: string;
  img?: string;
  probability?: string;
  method?: string;
  percent?: number;
}

export interface IGetSkillImageParams {
  idSkill: string;
  rank: string;
  avt: string;
  method: string;
  img?: string;
}

export interface IUpdateEquippedSkillBody {
  index: number;
  id: string;
  page: number;
  slot: number;
  type: string;
}

export interface IGetPowerInfoParams {
  id: string;
}

export interface IGetBankParams {
  id: string;
  img?: string | boolean;
}

export interface ICreateTransactionBody {
  id1: string;
  id2: string;
  value: number;
  img?: string;
}

export interface IGetInfoBarParams {
  name: string;
  avt: string;
  img?: string;
}

export interface IGetLeaderboardMoneyParams {
  img?: boolean;
  page: number | string;
}


// ===== User =====
export const getUserByName = (name: string, normal?: string, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/name", { params: { name, normal }, responseType }), responseType);

export const getUserById = (id: string, normal?: string, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/", { params: { id, normal }, responseType }), responseType);

export const createUser = (data: { id: string; name: string; firstName: string }, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.post("/", data, { responseType }), responseType);

export const updateUser = (data: { id: string; method: string; value: number; overwrite?: boolean }, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.patch("/", data, { responseType }), responseType);

export const deleteUser = (id: string, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.delete("/", { params: { id }, responseType }), responseType);

export const getEditUserPage = (responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/editUser", { responseType }), responseType);

// ===== Account =====
export const getAccountCreatePage = (responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/account/create", { responseType }), responseType);

export const getAccountGetPage = (responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/account/get", { responseType }), responseType);

// ===== Tracks =====
export const getTracks = (id?: number, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/tracks", { params: { id }, responseType }), responseType);

export const updateTracks = (tracks: any[], responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.put("/tracks", tracks, { responseType }), responseType);

export const searchMusic = async (search: string, img?: string, responseType?: "stream" | "arraybuffer") =>{
  try {
    const res = await API.get("/music", { params: { search, img }, responseType, timeout: 10000 });
    return res;
  } catch (err: any) {
    console.error("❌ API Error:", err.response?.data || err.message);
    throw err.response?.data || err.message;
  }
};

export const getMusicInfo = (id: number, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/music/select/info", { params: { id }, responseType, timeout: 5000 }), responseType);

export const getMusicAudio = (id: number, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/music/select/audio", { params: { id }, responseType, timeout: 5000 }), responseType);

export const getMusicLyrics = (id: number, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/music/select/lyrics", { params: { id }, responseType, timeout: 7000 }), responseType);

// ===== AI & Weather =====
export const queryAI = (query: {q: string, history?: boolean, ui?: boolean}, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/ai", { params: query, responseType }), responseType);

export const getWeather = (id: number, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/weather", { params: { id }, responseType }), responseType);

export const getWeatherImage = (id: number, img?: boolean | "true" , responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/weather/img", { params: { id, img }, responseType, timeout: 6000 }), responseType);

// ===== Skill =====
export const getSkillDeletePage = (responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/skill/delete", { responseType }), responseType);

export const getSkillCreatePage = (responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/skill/create", { responseType }), responseType);

export const createSkill = (data: any, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.post("/skill/create", data, { responseType }), responseType);

export const deleteSkill = (data: { id: number; sl: number }, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.delete("/skill/create", { data, responseType }), responseType);

// ===== Power & Bag =====
export const getEquipEditPage = (responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/power/editEquip", { responseType }), responseType);

export const getSkillBag = (params: { id: string; check?: boolean; fulldata?: boolean; type?: string }, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/power/bag/handle", { params, responseType }), responseType);

export const deleteSkillBag = (params: { id: string; i: number; type: string }, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.delete("/power/bag/handle", { params, responseType }), responseType);

export const getPowerDashboard = (params: { id: string; avt: string; img?: string }, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/power/dashboard", { params, responseType }), responseType);

export const addSkillToBag = (data: { idSkill: number; id: string; rank: string; method: string }, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.post("/power/skillbag", data, { responseType }), responseType);

export const getPageSkill = (params: { id: string; page: number; type?: string }, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/power/getpageskill", { params, responseType }), responseType);

export const getSkillBagImage = (params: { id: string; avt: string; page: number; type?: string; img?: string }, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/power/bag", { params, responseType }), responseType);

export const randomSkill = (params: { id: string; rank: string; probability?: string; method?: string; percent?: number }, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/power/random", { params, responseType }), responseType);

export type IRandomSkillImage = { id: string; rank: string; avt: string; img?: string; probability?: string; method?: string; percent?: number }

export const randomSkillImage = (params: IRandomSkillImage, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/power/random/image", { params, responseType }), responseType);

export const getSkillImage = (params: { idSkill: string; rank: string; avt: string; method: string; img?: string }, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/power/skill", { params, responseType }), responseType);

export const getEquippedSkill = (id: string, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/power/equip", { params: { id }, responseType }), responseType);

export const updateEquippedSkill = (data: { index: number; id: string; page: number; slot: number; type: string }, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.patch("/power/equip", data, { responseType }), responseType);

export const getPowerInfo = (id: string, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/power", { params: { id }, responseType }), responseType);

// ===== Bank & Transaction =====
export const getBank = (params: { id: string; img?: string | boolean, suffix?: string | boolean }, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/bank", { params, responseType }), responseType);

export const getTransactionPage = (responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/transaction", { responseType }), responseType);

export const createTransaction = (data: { id1: string; id2: string; value: number; img?: string }, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.post("/transaction", data, { responseType }), responseType);

// ===== Info & Leaderboard =====
export const getInfoBar = (params: { name: string; avt: string; img?: string }, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/infoBar", { params, responseType }), responseType);

export const getLeaderboardMoney = (params: {img?: boolean, page: number | string}, responseType?: "json" | "text" | "stream" | "arraybuffer") =>
  handleRequest(API.get("/leaderboard/money", { params, responseType }), responseType);
