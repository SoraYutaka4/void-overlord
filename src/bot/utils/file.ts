import fs from "fs";
import path from "path";
import { exec } from "child_process";
import axios from "axios";
import { loadCommand } from "../controllers/commandManager";
import unzipper from 'unzipper';
import { CM } from "../types";
import { addInjectCommand } from "./command";
import os from "os"
import { v4 as uuidv4 } from "uuid";


export async function runFileByPath(filePath: string, callback?: () => void): Promise<string> {
    try {
        const resolvedPath = path.resolve(filePath);
        if (!fs.existsSync(resolvedPath)) throw new Error(`❌ File does not exist: ${resolvedPath}`);

        const stats = fs.statSync(resolvedPath);
        if (!stats.isFile()) throw new Error(`❌ The path is not a valid file.`);

        const validExtensions = [".exe", ".bat", ".cmd", ".sh"];
        const ext = path.extname(resolvedPath).toLowerCase();
        if (!validExtensions.includes(ext)) throw new Error(`❌ Invalid file type (.exe, .bat, .cmd, .sh) only.`);

        if (ext === ".sh") {
            fs.chmodSync(resolvedPath, "755"); 
        }

        let command: string;
        if (process.platform === 'win32') {
            // Windows: run .bat, .cmd, or .exe
            command = ext === ".bat" || ext === ".cmd"
                ? `cd /d "${path.dirname(resolvedPath)}" && call "${path.basename(resolvedPath)}"`
                : `"${resolvedPath}"`; // For .exe
        } else {
            // Linux: run .sh
            command = ext === ".sh"
                ? `bash "${resolvedPath}"`
                : `"${resolvedPath}"`; // For .exe (Linux also supports running .exe via Wine if needed)
        }

        return await new Promise((resolve, reject) => {
            exec(command, (err, stdout, stderr) => {
                if (err) return reject(`❌ Error executing file:\n${err.message}`);
                if (typeof callback === "function") callback();
                resolve(`✅ File executed successfully!\n${stdout || stderr}`);
            });
        });
    } catch (error) {
        return `⚠️ ${(error as Error).message}`;
    }
}


export function convertStreamToBase64(stream: NodeJS.ReadableStream | Buffer | string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (Buffer.isBuffer(stream)) {
            return resolve(stream.toString("base64"));
        }

        if (typeof stream === "string") {
            return resolve(Buffer.from(stream).toString("base64"));
        }

        const chunks: Buffer[] = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
        stream.on("error", reject);
    });
}


async function saveToTempFile(buffer: Buffer): Promise<string> {
    const tempPath = path.join(os.tmpdir(), `${uuidv4()}.tmp`);
    fs.writeFileSync(tempPath, buffer);
    return tempPath;
  }
  
  export async function getFileStream(
    source: string | Buffer,
    type: "url" | "local" | "string",
    timeout = 5000
  ): Promise<NodeJS.ReadableStream | null> {
    try {
      if (Buffer.isBuffer(source)) {
        const path = await saveToTempFile(source);
        return fs.createReadStream(path);
      }
  
      if (typeof source === "string") {
        if (type === "string") {
          const buf = Buffer.from(source, "utf8");
          const path = await saveToTempFile(buf);
          return fs.createReadStream(path);
        }
  
        if (type === "url") {
          const response = await axios.get(source, {
            responseType: "arraybuffer",
            timeout,
            maxRedirects: 5
          });
          const path = await saveToTempFile(response.data);
          return fs.createReadStream(path);
        }
  
        if (type === "local") {
          if (!fs.existsSync(source)) {
            console.warn(`⚠️ File does not exist: ${source}`);
            return null;
          }
          fs.accessSync(source, fs.constants.R_OK);
          return fs.createReadStream(source);
        }
      }
  
      throw new Error("❌ Invalid source type!");
    } catch (error) {
      console.error(`❌ Error loading file from ${type}: ${source}`, error);
      return null;
    }
  }


export function getStreamSize(filePath: string): number {
    if (!fs.existsSync(filePath)) return 0;
    return fs.statSync(filePath).size;
}



export interface LoadCommandStatus {
    success: boolean;
    message: string;
}

export async function downloadAndExtractZip(url: string, saveDir: string): Promise<LoadCommandStatus> {
    const zipPath = path.join(saveDir, 'archive.zip');

    try {
        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }

        console.log('⚙ Downloading ZIP file from URL...');
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
        });

        const writer = fs.createWriteStream(zipPath);
        response.data.pipe(writer);

        await new Promise<void>((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        console.log('✅ ZIP file downloaded. Proceeding to extract...');

        await new Promise<void>((resolve, reject) => {
            fs.createReadStream(zipPath)
                .pipe(unzipper.Extract({ path: saveDir }))
                .on('close', resolve)
                .on('error', reject);
        });

        console.log('✅ Extraction successful!');
        fs.unlinkSync(zipPath);

        return {
            success: true,
            message: 'ZIP file downloaded and extracted successfully!'
        };

    } catch (error) {
        console.error('❌ Error while downloading or extracting file:', error);

        
        if (fs.existsSync(zipPath)) {
            try {
                fs.unlinkSync(zipPath);
            } catch (cleanupErr) {
                console.warn('⚠️ Failed to delete temporary zip file:', cleanupErr);
            }
        }

        const files = fs.readdirSync(saveDir);
        if (files.length === 0) {
            fs.rmdirSync(saveDir);
        }

        return {
            success: false,
            message: `Error while downloading and extracting file: ${(error as Error).message}`
        };
    }
}

export async function loadCommandFromUrl(url: string, savePath: string, manager: CM): Promise<LoadCommandStatus> {
    try {
        const dir = path.dirname(savePath);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }

        console.log('⚙ Starting the process of downloading and extracting ZIP file...');

        const installed = await downloadAndExtractZip(url, savePath);

        if (!installed.success) return installed;

        console.log('⚙ Proceeding to load command from extracted directory...');

        const filePath = path.resolve(savePath, "plugin.ts");

        if (!fs.existsSync(filePath)){
            return {
                success: false,
                message: `File not found: ${filePath}`
            };
        }

        const result: LoadCommandStatus = await loadCommand(filePath, manager);

        if (!result.success) {
            console.error('Error while loading command:', result.message);
            return { success: false, message: result.message };
        }

        addInjectCommand(filePath);

        console.log('✅ Command loaded successfully!');
        return { success: true, message: "Command loaded successfully!" };
    } catch (error) {
        console.error('An error occurred during the file download or extraction process:', error);
        return { success: false, message: "Error while downloading or extracting file." };
    }
}