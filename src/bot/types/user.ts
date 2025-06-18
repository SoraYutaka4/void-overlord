export const API_URL = "http://localhost:8000/api";

export enum UserError {
  INVALID_DATA = 111, // Dữ liệu không hợp lệ
  USER_EXISTS = 112, // Người dùng đã tồn tại
  CREATE_FAILED = 113, // Lỗi khi tạo user
  UPDATE_FAILED = 114, // Lỗi khi cập nhật user
  DELETE_FAILED = 115, // Lỗi khi xoá user
  NOT_FOUND = 116, // Không tìm thấy user
  UNKNOWN_ERROR = 117, // Lỗi không xác định
  MAX_BALANCE = 118
}


export const UserErrorMessages = {
  vi: {
    [UserError.INVALID_DATA]: "Dữ liệu không hợp lệ! Dữ liệu này có phải từ tương lai không? 🤔",
    [UserError.USER_EXISTS]: "Người dùng đã tồn tại. Cậu không thể đẻ thêm người dùng đâu! 😂",
    [UserError.CREATE_FAILED]: "Lỗi hệ thống khi tạo người dùng. Hệ thống đang lười quá, chắc đang nghỉ trưa 😴",
    [UserError.UPDATE_FAILED]: "Lỗi khi cập nhật người dùng. Hệ thống có vẻ bị lạc mất dữ liệu rồi 🕵️‍♂️",
    [UserError.DELETE_FAILED]: "Lỗi khi xoá người dùng. Ai đó đã cài đặt tính năng 'Không thể xóa' 😂",
    [UserError.NOT_FOUND]: "Không tìm thấy người dùng. Cậu này biến mất rồi, như ninja vậy 🥷",
    [UserError.MAX_BALANCE]: "Ví đã đầy! Cậu đang giàu quá mức quy định rồi 💸🤑",
    [UserError.UNKNOWN_ERROR]: "Có lỗi không xác định xảy ra. Chắc hệ thống đang chơi trò ma quái rồi 👻",
  },
  en: {
    [UserError.INVALID_DATA]: "Invalid data.",
    [UserError.USER_EXISTS]: "User already exists.",
    [UserError.CREATE_FAILED]: "System error while creating user.",
    [UserError.UPDATE_FAILED]: "Error updating user.",
    [UserError.DELETE_FAILED]: "Error deleting user.",
    [UserError.NOT_FOUND]: "User not found.",
    [UserError.MAX_BALANCE]: "User has reached the maximum balance limit.",
    [UserError.UNKNOWN_ERROR]: "An unknown error occurred.",
  },
};

export interface User {
  id: string;
  name: string;
  firstName: string;
  level: number;
  exp: number;
  balance: bigint;
  DT_Daily: string;
  DT_Command: string;
  DT_Fight: string;
  defeated_lost: bigint;
  powers: Power[];
  bagSkills: BagSkill[];
  skillSlots: SkillSlot[];
}

export interface Power {
  attack: bigint;
  defense: bigint;
  userId: string;
}

export interface BagSkill {
  userId: string;
  fight: string;
  defense: string;
  special: string;
}

export interface SkillSlot {
  id: string;
  userId: string;
  skillS1Id?: string;
  skillS2Id?: string;
  skillS3Id?: string;
  skillS4Id?: string;
  skillS5Id?: string;
  skillS1?: InfoSkillFight;
  skillS2?: InfoSkillFight;
  skillS3?: InfoSkillDefense;
  skillS4?: InfoSkillDefense;
  skillS5?: InfoSkillSpecial;
}

export interface InfoSkillFight {
  id: string;
  name: string;
  description: string;
  attack: number;
  sign: string;
  level: number;
  rank: string;
  imgUrl: string;
  SID: number;
}

export interface InfoSkillDefense {
  id: string;
  name: string;
  description: string;
  defense: number;
  sign: string;
  level: number;
  rank: string;
  imgUrl: string;
  SID: number;
}

export interface InfoSkillSpecial {
  id: string;
  name: string;
  description: string;
  attack: number;
  defense: number;
  sign_attack: string;
  sign_defense: string;
  level: number;
  rank: string;
  imgUrl: string;
  SID: number;
}

  
export interface UpdateUserRequest {
  id: string;
  method: "balance" | "exp" | "level" | "DT_Daily";
  value?: number | bigint;
  overwrite?: boolean;
}

export interface UserManagerInterface {
  getUserByID: (id: string, normal?: boolean, errLog?: boolean) => Promise<User | UserError>;
  getUserByName: (name: string, normal?: boolean) => Promise<User | UserError>;
  createUser: (id: string, name: string, firstName: string) => Promise<User | UserError>;
  updateUser: (
    id: string,
    method: UpdateUserRequest["method"],
    value?: number | bigint,
    overwrite?: boolean
  ) => Promise<boolean | UserError>;
  deleteUser: (id: string) => Promise<boolean | UserError>;
}
  