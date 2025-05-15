import { Server, Socket } from "socket.io";
import path from "path";
import fs from "fs";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { checkApiStatus } from "./checkStatus";
import sharp from "sharp";
import ffmpeg from 'fluent-ffmpeg';
import getVideoDurationInSeconds from 'get-video-duration';
import  { fileTypeFromBuffer } from "file-type";

type MessageType = "text" | "image" | "gif" | "file" | "video" | "audio" | "combined";

type FileData = {
    name: string;
    url: string;
    size: number;
    type: string;
    ext: string,
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
    mentions?: Record<string, string>; // ✅ Thêm mentions
};

type StateMessage = {
    status: "ok" | "error",
    message?: string,
    id: string
}

const history: Record<string, Message[]> = {};
const UPLOADS_DIR = path.join(__dirname, "uploads");

if (fs.existsSync(UPLOADS_DIR)) {
    fs.rmSync(UPLOADS_DIR, { recursive: true, force: true });
}
fs.mkdirSync(UPLOADS_DIR);

const ALLOWED_EXTENSIONS = [
    // 📷 Hình ảnh (Image)
    ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff", ".tif", ".svg", ".ico", ".heic", ".avif",

    // 🎥 Video
    ".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv", ".wmv", ".mpeg", ".3gp", ".f4v", ".ogv", ".m2ts",

    // 🎵 Âm thanh (Audio)
    ".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma", ".aiff", ".amr", ".mid", ".mpga",

    // 📄 Tài liệu (Documents)
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv",
    ".json", ".xml", ".yaml", ".yml", ".md", ".log", ".rtf", ".odt", ".ods", ".odp", ".epub",

    // 📦 File nén (Compressed)
    ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz", ".iso", ".cab", ".tgz", ".zst",

    // 💻 Mã nguồn & Script (Code & Scripts)
    ".html", ".css", ".js", ".ts", ".jsx", ".tsx", ".php", ".py", ".java", ".cpp",
    ".c", ".h", ".cs", ".go", ".rb", ".swift", ".sh", ".bat", ".cmd", ".pl",
    ".lua", ".sql", ".r", ".kt", ".dart", ".jsonc", ".toml",

    // 🔥 File thực thi (Executables)
    ".exe", ".msi", ".apk", ".app", ".deb", ".rpm", ".dmg", ".run", ".bin", ".elf",

    // 🎨 Đồ họa & CAD (Graphics & CAD)
    ".psd", ".ai", ".eps", ".indd", ".sketch", ".fig", ".dwg", ".dxf",

    // 🎮 Game & Data
    ".iso", ".nsp", ".xci", ".sav", ".pak", ".vpk",

    // 📊 Dữ liệu & Database
    ".sqlite", ".db", ".sql", ".mdb", ".accdb"
];

  
const MAX_FILE_SIZE = 10 * 1024 * 1024; 
const MAX_STORAGE_SIZE = 128 * 1024 * 1024; 

const cleanOldFiles = () => {
    const files = fs.readdirSync(UPLOADS_DIR).map(file => {
        const filePath = path.join(UPLOADS_DIR, file);
        return { path: filePath, time: fs.statSync(filePath).mtimeMs, size: fs.statSync(filePath).size };
    });

    files.sort((a, b) => a.time - b.time);

    let totalSize = files.reduce((acc, file) => acc + file.size, 0);

    while (totalSize > MAX_STORAGE_SIZE && files.length > 0) {
        const oldestFile = files.shift();
        if (oldestFile) {
            fs.unlinkSync(oldestFile.path);
            totalSize -= oldestFile.size;
        }
    }
};

// ✅ Hàm tách mentions từ nội dung text
const extractMentions = async (content: string): Promise<Record<string, string> | null> => {
    const mentionRegex = /@(\w+)/g;
    const mentions: Record<string, string> = {};
    const matchList: string[] = [];

    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
        matchList.push(match[1]);
    }

    if (matchList.length === 0) return null;

    await Promise.all(
        matchList.map(async (userId) => {
            if (["bot", "Bot"].includes(userId))
                return mentions[userId] = userId;

            try {
                const res = await axios.get(`http://localhost:8000/api?id=${userId}&normal=true`);
                if (checkApiStatus(res.status) && res.data?.name) {
                    mentions[userId] = res.data.name;
                }
            } catch (error) {
                console.warn(`⚠️ Không thể lấy dữ liệu của ${userId}`);
            }
        })
    );

    return Object.keys(mentions).length > 0 ? mentions : null;
};

async function processImage(
    inputBuffer: Buffer,
    maxWidth: number,
    maxHeight: number
  ): Promise<{ data: Buffer; width: number; height: number }> {
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();
  
    let width = metadata.width!;
    let height = metadata.height!;
  
    if (width <= maxWidth && height <= maxHeight) {
      return { data: inputBuffer, width, height };
    }
  
    const resizedImage = image.resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside', 
      withoutEnlargement: true, 
    });
  
    const buffer = await resizedImage.toBuffer();
    const resizedMetadata = await sharp(buffer).metadata();
  
    return {
      data: buffer,
      width: resizedMetadata.width!,
      height: resizedMetadata.height!,
    };
}



async function processGif(
    inputBuffer: Buffer,
    maxWidth: number,
    maxHeight: number
  ): Promise<{ data: Buffer; width: number; height: number }> {
    const image = sharp(inputBuffer, { animated: true });
    const metadata = await image.metadata();
  
    let width = metadata.width!;
    let height = metadata.height!;
  
    if (width <= maxWidth && height <= maxHeight) {
      return { data: inputBuffer, width, height };
    }
  
    const resizedImage = image.resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });
  
    const buffer = await resizedImage.toBuffer();
    const resizedMetadata = await sharp(buffer, { animated: true }).metadata();
  
    return {
      data: buffer,
      width,
      height,
    };
}

async function processVideo(buffer: Buffer, ext: string): Promise<{ width: number; height: number, duration: number }> {
    const tempPath = path.join(__dirname, `cache/temp-${Date.now()}.${ext}`);
  
    if (!fs.existsSync('./cache')) {
      fs.mkdirSync('./cache', { recursive: true });
    }
  
    fs.writeFileSync(tempPath, buffer);
  
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(tempPath, async (err, metadata) => {
  
        if (err) return reject(err);
  
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (!videoStream) {
            fs.unlinkSync(tempPath);
          return reject(new Error('No video stream found'));
        }
  
        const width = videoStream.width!;
        const height = videoStream.height!;
  
        const formatDuration = metadata.format?.duration ?? await getVideoDurationInSeconds(tempPath);
  
        resolve({ width, height, duration: formatDuration });
        fs.unlinkSync(tempPath);
      });
    });
}

async function processAudio(buffer: Buffer, ext: string): Promise<number> {
    const tempFilePath = path.join(__dirname, `cache/tempAudioFile.${ext}`);
    
    try {
        await fs.promises.writeFile(tempFilePath, buffer);
    
        const metadata = await new Promise<any>((resolve, reject) => {
            ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
            if (err) {
                fs.unlinkSync(tempFilePath);
                reject('Error extracting metadata');
            }
            else resolve(metadata);
            });
        });
    
        const duration = metadata.format.duration;
        fs.unlinkSync(tempFilePath);
  
        return duration; 
    } catch (err) {
      console.error('Error:', err);
      throw new Error('Error processing audio');
    }
}

  


const socketRoutes = (io: Server): void => {
    io.on("connection", (socket: Socket) => {
        const sendState = (info: StateMessage) => socket.emit("state message", info);

        console.log("Client đã kết nối:", socket.id);

        socket.on("join room", (idRoom: string) => {
            socket.join(idRoom);
            if (!history[idRoom]) history[idRoom] = [];
            socket.emit("chat history", history[idRoom]);
        });
        
        socket.on("chat message", async (msg: Message) => {
            if (!msg || (!msg.content && (!msg.files || msg.files.length === 0))) {
                if (msg.id) sendState({ id: msg.id, status: "error", message: "Tin nhắn không hợp lệ" });
                return;
            }
        
            const mentions = msg.content ? await extractMentions(msg.content) : undefined;
        
            const newMessage: Message = {
                id: msg.id ?? uuidv4(),
                idRoom: msg.idRoom,
                sender: msg.sender,
                timestamp: msg.timestamp || Date.now(),
                content: msg.content || undefined,
                files: [],
                type: "text",
                ...(mentions ? { mentions } : {}),
            };
        
            let messageHasFile = false;

            if (msg.files && msg.files.length > 0) {
                for (const file of msg.files) {
                    const ext = path.extname(file.name).toLowerCase();
                    if (!ALLOWED_EXTENSIONS.includes(ext)) {
                        if (msg.id) sendState({ id: msg.id, status: "error", message: `Tệp không hợp lệ: ${file.name}` });
                        return;
                    }
        
                    const buffer = Buffer.from(file.url.split(",")[1], "base64");
                    if (buffer.length > MAX_FILE_SIZE) {
                        if (msg.id) sendState({ id: msg.id, status: "error", message: `Tệp quá lớn: ${file.name}` });
                        return;
                    }
        
                    const uniqueName = `${uuidv4()}${ext}`;
                    const filePath = path.join(UPLOADS_DIR, uniqueName);
                    try {
                        let fileType: string = "file";
                        let width = null;
                        let height = null;
                        let duration = null;
                        let new_buffer: Buffer = buffer;
        
                        if ([".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".tif", ".svg", ".ico", ".heic", ".avif"].includes(ext)) {
                            const result = await processImage(buffer, 1280, 720); 
                            
                            fileType = "image";
                            new_buffer = result.data;
                            width = result.width;
                            height = result.height;
                        }
        
                        if (ext === ".gif") {
                            const result = await processGif(buffer, 1280, 720); 
                            
                            fileType = "gif";
                            width = result.width;
                            height = result.height;
                        }
        
                        if ([".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv", ".wmv", ".mpeg", ".3gp", ".f4v", ".ogv", ".m2ts"].includes(ext)) {
                            try {
                                const result = await processVideo(buffer, ext);
                                
                                fileType = "video";
                                width = result.width;
                                height = result.height;
                                duration = result.duration;
                            } catch (error) {
                                if (error instanceof Error) {
                                    console.error(`Error processing video: ${error.message}`);
                                } else {
                                    console.error("Error processing video:", error);
                                }
                            }
                        }
                        
                        if ([".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma", ".aiff", ".amr", ".mid", ".mpga", ".mpeg"].includes(ext)) {
                            try {
                                fileType = "audio";
                                duration = await processAudio(buffer, ext);
                            } catch (error) {
                                if (error instanceof Error) {
                                    console.error(`Error processing audio: ${error.message}`);
                                } else {
                                    console.error("Error processing audio:", error);
                                }
                            }
                        }
        
                        fs.writeFileSync(filePath, new_buffer);

                        const contentType = (await fileTypeFromBuffer(new_buffer))?.mime ?? "";
                        
                        const data: FileData = {
                            name: file.name,
                            url: `http://localhost:8000/uploads/${uniqueName}`,
                            size: new_buffer.length,
                            type: fileType,
                            ext,
                            id: uuidv4(),
                            width: width ?? undefined,
                            height: height ?? undefined,
                            duration: duration ?? undefined,
                            mimeType: contentType
                        }

                        newMessage.files?.push(data);
        
                        if (newMessage.content) {
                            newMessage.type = "combined";
                        } else {
                            newMessage.type = fileType as MessageType;
                        }
        
                    } catch (err) {
                        console.error("Lỗi khi lưu tệp:", err);
                        if (msg.id) sendState({ id: msg.id, status: "error", message: `Lỗi khi lưu tệp: ${file.name}` });
                        return;
                    }
                }
                cleanOldFiles(); 
            }
        
            if (!history[msg.idRoom]) {
                history[msg.idRoom] = [];
            }
        
            history[msg.idRoom].push(newMessage);
            if (history[msg.idRoom].length > 50) history[msg.idRoom].shift();
        
            io.to(msg.idRoom).emit("chat message", newMessage);
            if (msg.id) sendState({ status: "ok", id: msg.id });
        });
        
        

        socket.on("delete message", ({ idRoom, messageId, senderId }) => {
            if (!history[idRoom]) {
                console.warn(`⚠️ Phòng ${idRoom} không tồn tại.`);
                socket.emit("state message", { status: "error", message: "Phòng không tồn tại", id: messageId });
                return;
            }
        
            const messageIndex = history[idRoom].findIndex(msg => msg.id === messageId);
            if (messageIndex === -1) {
                console.warn(`⚠️ Tin nhắn ${messageId} không tồn tại.`);
                socket.emit("state message", { status: "error", message: "Tin nhắn không tồn tại", id: messageId });
                return;
            }
        
            const message = history[idRoom][messageIndex];
        
            // 🔒 Kiểm tra nếu người yêu cầu có phải chủ tin nhắn không
            if (message.sender !== senderId) {
                console.warn(`⛔ Người dùng ${senderId} không thể xóa tin nhắn của ${message.sender}`);
                socket.emit("state message", { status: "error", message: "Bạn không có quyền gỡ tin nhắn này", id: messageId });
                return;
            }
        
            // 🗑 Xóa file đính kèm nếu có
            if (message.files && message.files.length > 0) {
                message.files.forEach(file => {
                    const filePath = path.join(UPLOADS_DIR, path.basename(file.url));
                    fs.unlink(filePath, err => {
                        if (err) {
                            console.warn(`⚠️ Không thể xóa file: ${filePath}`);
                        }
                    });
                });
            }
        
            // ❌ Xóa tin nhắn khỏi lịch sử
            history[idRoom].splice(messageIndex, 1);
        
            // 🔄 Gửi thông báo xóa tin nhắn đến tất cả client trong phòng
            io.to(idRoom).emit("delete message", { messageId });
        
            // ✅ Phản hồi lại client về trạng thái thành công
            socket.emit("state message", { status: "ok", id: messageId });
        });
        
        
        socket.on("typing", ({ idRoom, senderId, isTyping }) => {
            if (!idRoom || !senderId || typeof isTyping !== "boolean") {
                console.error("Dữ liệu không hợp lệ khi nhận sự kiện 'typing'");
                return;
            }
            
            io.to(idRoom).emit("typing", { senderId, isTyping });
        });

        
    });
};

export default socketRoutes;
