import { UserManagerInterface, User, API_URL, UserError, UpdateUserRequest, UserErrorMessages } from "../types/user";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 5000, 
});

export const isUserError = (error: any): error is UserError => {
  return Object.values(UserError).includes(error);
};

export const getUserErrorMessage = (errorCode: UserError, lang: "vi" | "en" = "vi") => {
  return UserErrorMessages[lang]?.[errorCode] || UserErrorMessages[lang][UserError.UNKNOWN_ERROR];
};

const handleError = (error: unknown, message: string, errorCode: UserError, ntf = true): UserError => {
  const axiosError = error as axios.AxiosError;
  if (ntf) console.error(`❗ ${message}:`, axiosError?.response?.data || axiosError.message);

  if (axiosError.response?.status === 404) return UserError.NOT_FOUND;

  if (axiosError.response?.status === 409) return UserError.USER_EXISTS;

  if (axiosError.response?.status === 500) return UserError.UNKNOWN_ERROR;

  return errorCode;
};

export const UserManager: UserManagerInterface = {
  async getUserByID(id: string, normal = true, ntf = true): Promise<User | UserError> {
    try {
      const { data } = await axiosInstance.get("/", { params: { id, normal } });
      return data as User;
    } catch (error) {
      return handleError(error, "Error fetching user by ID", UserError.UNKNOWN_ERROR, ntf);
    }
  },

  async getUserByName(name: string, normal = true): Promise<User | UserError> {
    try {
      const { data } = await axiosInstance.get("/name", { params: { name, normal } });
      return data as User;
    } catch (error) {
      return handleError(error, "Error fetching user by name", UserError.UNKNOWN_ERROR);
    }
  },

  async createUser(id: string, name: string, firstName: string): Promise<User | UserError> {
    if (!id || !name || !firstName) return UserError.INVALID_DATA;
  
    try {
      const existingUser = await this.getUserByID(id);
      if (existingUser !== UserError.NOT_FOUND) {
        return UserError.USER_EXISTS; 
      }
  
      const { data, status } = await axiosInstance.post("/", { id, name, firstName });
      return status === 201 ? (data as User) : UserError.CREATE_FAILED;
  
    } catch (error) {
      return handleError(error, "Error creating user", UserError.CREATE_FAILED);
    }
  },

  async updateUser(
    id: string, 
    method: UpdateUserRequest["method"], 
    value?: number | bigint, 
    overwrite?: boolean
  ): Promise<boolean | UserError> {
    if (!id || !method) return UserError.INVALID_DATA;
  
    try {
      const existingUser = await this.getUserByID(id);
      if (isUserError(existingUser)) return existingUser;

      const maxBalance = 10n ** 18n - 10n ** 17n;
      const valueBigInt = BigInt(value ?? 0);
      const currentBalance = BigInt(existingUser.balance);
      
      if (valueBigInt >= maxBalance || valueBigInt + currentBalance >= maxBalance)
        return UserError.MAX_BALANCE;

      const { status } = await axiosInstance.patch("/", { id, method, value, overwrite });
      return status === 200 ? true : UserError.UPDATE_FAILED;
      
    } catch (error) {
      return handleError(error, "Error updating user", UserError.UPDATE_FAILED);
    }
  },  

  async deleteUser(id: string): Promise<boolean | UserError> {
    if (!id) return UserError.INVALID_DATA;
  
    try {
      const existingUser = await this.getUserByID(id);
      if (existingUser === UserError.NOT_FOUND) {
        return UserError.NOT_FOUND; 
      }
  
      const { status } = await axiosInstance.delete("/", { params: { id } });
      return status === 200 ? true : UserError.DELETE_FAILED;
      
    } catch (error) {
      return handleError(error, "Error deleting user", UserError.DELETE_FAILED);
    }
  },

};