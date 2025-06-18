import fs from "fs";
import { io } from "socket.io-client";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { CommandMessage as C_Message, MessageInfo, StateMessage, API, New_Message, Middleware_API } from "../types";
import { IFCAU_User as UserInfo, IFCAU_Thread as ThreadInfo } from "../types";
import { convertStreamToBase64, getMimeTypeFromBase64, mimeToExt } from "../utils";

type MessageType = "text" | "image" | "gif" | "file" | "video" | "audio" | "combined";

type FileData = {
    name: string;
    url: string;
    size: number;
    type: string;
    ext: string;
    id: string;
    mimeType: string;
    width?: number;
    height?: number;
    duration?: number;
};

type Message = {
    id: string;
    idRoom: string;
    type: MessageType;
    content?: string;
    sender: string;
    timestamp: number;
    files?: FileData[];
    mentions?: Record<string, string>;
};

const currentUsersJsonPath = path.join(__dirname, "randomUsers.json");
const currentGroupJsonPath = path.join(__dirname, "groupsInfo.json");

type TempUser = {
    id: string;
    name: string;
    firstName: string;
    thumbSrc: string;
    profileUrl: string;
    type: string; 
}

function parseUsersFromFile(filePath: string): TempUser[] {
    if (!fs.existsSync(filePath)) throw new Error("File không tồn tại");

    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) throw new Error("Dữ liệu không phải mảng");

    const validUsers: UserInfo[] = data.filter((user: any): user is UserInfo => {
        return (
            typeof user.id === "string" &&
            typeof user.name === "string" &&
            typeof user.firstName === "string" &&
            typeof user.thumbSrc === "string" &&
            typeof user.profileUrl === "string"
        );
    });
    return validUsers.filter((user): user is TempUser => user.profileUrl !== null && typeof user.type === "string");
}


function parseGroupInfoFromFile(filePath: string): ThreadInfo {
  if (!fs.existsSync(filePath)) throw new Error("❌ File không tồn tại");

  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  if (
    typeof data.threadID !== "string" ||
    !Array.isArray(data.participantIDs) ||
    !Array.isArray(data.userInfo)
  ) {
    throw new Error("❌ Dữ liệu không hợp lệ hoặc thiếu thông tin cần thiết");
  }

  return data as ThreadInfo;
}




export default (callback: (api: API, message: C_Message) => void) => {
    console.log("🔄 Middleware Loading");

    const socket = io("http://localhost:8000");
    const pendingMessages: Partial<Message>[] = []; 

    const api: Middleware_API = {
        sendMessage : async (
            message: New_Message | string,
            threadID: string,
            callback?: (error: string | null, messageInfo: MessageInfo) => void,
            messageID?: string
        ) => {
            try {
                const attachment = typeof message === "string" ? [] : message.attachment ?? [];
        
                const fileResults = await Promise.allSettled(
                    (Array.isArray(attachment) ? attachment : []).map(async (file) => {
                        try {
                            const base64Data = await convertStreamToBase64(file);
                            const size = Buffer.byteLength(base64Data, "base64");
                            const mimeType = await getMimeTypeFromBase64(base64Data);
                            
                            if (!mimeType) throw new Error("Could not determine file MIME type!");
                            const ext = mimeToExt(mimeType);
        
                            return {
                                name: `${uuidv4()}.${mimeType.split("/")[1]}`,
                                url: `data:${mimeType};base64,${base64Data}`,
                                type: ext ? ext : "unknow",
                                size,
                            };
                        } catch (error) {
                            console.warn("⚠️ Error processing file:", error);
                            return null;
                        }
                    })
                );
        
                const validFiles: FileData[] = fileResults
                    .filter((result): result is PromiseFulfilledResult<FileData> => result.status === "fulfilled" && result.value !== null)
                    .map((result) => result.value);
        
                const random_id = messageID ?? uuidv4();
                const timestamp = Date.now();
        
                const convert_message: Partial<Message> = {
                    id: random_id,
                    idRoom: threadID,
                    type: validFiles.length ? "combined" : "text",
                    content: typeof message === "string" ? message : message.body ?? "",
                    sender: "Bot",
                    timestamp,
                    files: validFiles.length ? validFiles : undefined
                };
        
                if (!socket.connected) {
                    console.warn("⚠️ WebSocket disconnected! Attempting to reconnect...");
                    socket.connect(); 
                    pendingMessages.push(convert_message); 
                    callback?.("⚠️ WebSocket is not ready!", { threadID, messageID: random_id, timestamp });
                    return;
                }
                
                socket.emit("typing", {
                    idRoom: threadID,
                    senderId: "Bot",
                    isTyping: false
                });
                
                socket.emit("chat message", convert_message);
        
                const timeout = setTimeout(() => {
                    callback?.("⏳ Timeout: Server not responding", { threadID, messageID: random_id, timestamp });
                }, 5000);
        
                socket.once("state message", (info: StateMessage) => {
                    clearTimeout(timeout);
                    callback?.(info.status === "error" ? info.message ?? "" : null, {
                        threadID,
                        messageID: random_id,
                        timestamp
                    });
                });
            } catch (error) {
                console.error("❌ Error sending message:", error);
                callback?.("❌ Failed to send message!", { threadID, messageID: uuidv4(), timestamp: Date.now() });
            }
        },
        
        
    
        unsendMessage: (messageID: string, callback?: (err?: Error) => void): Promise<void> => {
            return new Promise((resolve, reject) => {
                if (!messageID) {
                    const error = new Error("❌ No message ID to delete!");
                    if (callback) callback(error);
                    return reject(error);
                }
        
                socket.emit("delete message", { senderId: "Bot", idRoom: "bot", messageId: messageID });
        
                const timeout = setTimeout(() => {
                    const error = new Error("⏳ Timeout: Server not responding");
                    if (callback) callback(error);
                    reject(error);
                }, 5000);
        
                socket.once("state message", (info: StateMessage) => {
                    clearTimeout(timeout);
        
                    if (info.status === "error") {
                        const error = new Error(`❌ Could not delete message: ${info.message || "Unknown error"}`);
                        if (callback) callback(error);
                        reject(error);
                    } else {
                        if (callback) callback(undefined); 
                        resolve();
                    }
                });
            });
        },
        
        getUserInfo: (
            userID: string | string[],
            callback?: (error: string | null, userInfo: Record<string, UserInfo>) => void
          ): Promise<Record<string, UserInfo>> => {
            return new Promise((resolve, reject) => {
              try {
                  const userIDs = Array.isArray(userID)
                  ? userID
                  : typeof userID === "string"
                      ? userID.split(",")
                      : [];
                const users = parseUsersFromFile(currentUsersJsonPath);
            
                const userInfoRecord: Record<string, UserInfo> = {};

                userIDs.forEach((id) => {
                  const found = users.find((u) => u.id === id);

                  if (found) {
                    userInfoRecord[id] = {
                      ...found,
                      type: "user"
                    };
                  } else {
                    console.log(`❌ Không tìm thấy người dùng với ID: ${id}`);
                  }
                });
            
                if (callback) callback(null, userInfoRecord);
                resolve(userInfoRecord);
            
              } catch (error) {
                console.error("🔥 Error in getUserInfo:", error);
                if (callback) callback("Có lỗi xảy ra khi lấy thông tin người dùng", {});
                reject(error);
              }
            });
          },


          getThreadInfo: (
            threadID: string,
            callback?: (err: Error | null, thread: ThreadInfo) => void
          ): Promise<ThreadInfo> => {
            return new Promise((resolve, reject) => {
              try {
                const thread = parseGroupInfoFromFile(currentGroupJsonPath);
                if (callback) callback(null, thread);
                resolve(thread);
              } catch (err) {
                const error = err instanceof Error ? err : new Error("❌ Lỗi không xác định");
                if (callback) callback(error, undefined as any);
                reject(error);
              }
            });
          },  
          

        sendTypingIndicator(
            threadID: string,
            callback?: (err: Error | null) => void
        ): void {
            
            socket.emit("typing", {
                idRoom: threadID,
                senderId: "Bot",
                isTyping: true
            });

            if (callback) callback(null);
        },

        getCurrentUserID: () => {
            return "Bot";
        }
    };

    const handleChatMessage = async (message: Message) => {
        // console.log("✅ Received message:", message); // Log for debugging

        if (message.sender === "Bot") return;

        const new_message: C_Message = {
            type: "message",
            senderID: message.sender,
            threadID: message.idRoom,
            messageID: message.id,
            isGroup: true,
            body: message.content ?? "",
            mentions: message.mentions ?? {},
            attachments: []
        };

        if (message.content) new_message.body = message.content;
        if (message.mentions) new_message.mentions = message.mentions;

        if (message.files) {
            message.files.forEach(file => {
               if (file.type === "image") {
                    new_message.attachments.push({
                        type: "photo",
                        filename: file.name,
                        thumbnailUrl: "",
                        previewUrl: "",
                        previewWidth: 0,
                        previewHeight: 0,
                        largePreviewUrl: file.url,
                        largePreviewWidth: file.width ?? 0,
                        largePreviewHeight: file.height ?? 0,
                        url: file.url,
                        width: file.width ?? 0,
                        height: file.height ?? 0,
                        ID: file.id
                    })
               }

               if (file.type === "gif") {
                    new_message.attachments.push({
                        type: "animated_image",
                        filename: file.name,
                        previewUrl: "",
                        previewWidth: 0,
                        previewHeight: 0,
                        url: file.url,
                        width: file.width ?? 0,
                        height: file.height ?? 0,
                        ID: file.id
                    });
                }

                if (file.type === "video") {
                    new_message.attachments.push({
                        type: "video",
                        filename: file.name,
                        previewUrl: "",
                        previewWidth: 0,
                        previewHeight: 0,
                        url: file.url,
                        width: file.width ?? 0,
                        height: file.height ?? 0,
                        ID: file.id,
                        videoType: file.ext,
                        duration: file.duration ?? 0
                    })
                }
            
                if (file.type === "audio"){
                    new_message.attachments.push({
                        type: "audio",
                        filename: file.name,
                        url: file.url,
                        ID: file.id,
                        audioType: file.ext,
                        duration: file.duration ?? 0,
                        isVoiceMail: false
                    })
                }

                if (file.type === "file"){
                    new_message.attachments.push({
                        type: "file",
                        filename: file.name,
                        url: file.url,
                        ID: file.id,
                        isMalicious: false,
                        contentType: file.mimeType
                    })
                }


            });
        }

        callback(api as API, new_message);
    };

    const registerOrUpdateChatMessageListener = () => {
        socket.off("chat message"); 
        socket.on("chat message", handleChatMessage);
        console.log("✅ Chat message listener registered/updated"); 
    };

    socket.on("connect", () => {
        console.log("✅ Connected Successfully!", socket.id);

        while (pendingMessages.length > 0) {
            const msg = pendingMessages.shift();
            if (msg) {
                console.log("➡️ Sending queued message:", msg); 
                socket.emit("chat message", msg);
            }
        }

        registerOrUpdateChatMessageListener();  

        socket.emit("join room", "bot");
    });

    socket.on("reconnect", (attempt) => {
        console.log(`🔄 Reconnected successfully after ${attempt} attempts!`);

        while (pendingMessages.length > 0) {
            const msg = pendingMessages.shift();
            if (msg) {
                console.log("➡️ Sending queued message on reconnect:", msg); 
                socket.emit("chat message", msg);
            }
        }

        registerOrUpdateChatMessageListener(); 

        socket.emit("join room", "bot"); 
    });

    socket.on("disconnect", () => {
        console.log("❌ Disconnected from server!");
    });

    setInterval(() => {
        if (!socket.connected) {
            console.warn("⚠️ Disconnected! Attempting to reconnect...");
            socket.connect();
        }
    }, 10000); 
};
