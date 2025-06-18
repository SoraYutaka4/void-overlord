import fs from "fs";
import crypto from "crypto";
import archiver from "archiver";
import extract from "extract-zip";
import yauzl from "yauzl-promise";
import path from "path";

export async function encryptFile(inputPath: string, outputPath: string, secretKey: string): Promise<void> {
  const key = Buffer.from(secretKey, "hex");

  if (key.length !== 32) {
    console.error("Secret key must be 32 bytes long (256 bits) for AES-256-CBC.");
  }

  const iv = crypto.randomBytes(16); 
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  output.write(iv);

  await new Promise<void>((resolve, reject) => {
    input
      .pipe(cipher)
      .pipe(output)
      .on("finish", resolve)
      .on("error", reject);
  });
}

export function removeDiacritics(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}


export async function encryptFolder(inputFolder: string, outputFolder: string, secretKey: string, useSha256Naming: boolean = false): Promise<void> {
  const files = await fs.promises.readdir(inputFolder);

  await fs.promises.mkdir(outputFolder, { recursive: true });

  for (const file of files) {
    const inputPath = path.join(inputFolder, file);
    const fileStats = await fs.promises.stat(inputPath);

    if (fileStats.isFile()) {
      let outputFileName = file.slice(0, file.lastIndexOf('.'));
      console.log(`🔐 Encrypting ${outputFileName}...`);

      outputFileName = removeDiacritics(outputFileName);
      
      if (useSha256Naming) {
        const hash = crypto.createHash('sha256').update(outputFileName).digest('hex');
        outputFileName = hash + ".enc"; 
      } else {
        outputFileName += ".enc"; 
      }

      const outputPath = path.join(outputFolder, outputFileName);
      await encryptFile(inputPath, outputPath, secretKey);
    }
  }
}




export async function decryptFile(inputPath: string, outputPath: string, secretKey: string) {
  const input = fs.createReadStream(inputPath, { start: 16 });
  const output = fs.createWriteStream(outputPath);

  const fd = await fs.promises.open(inputPath, "r");
  const ivBuffer = Buffer.alloc(16);
  await fd.read(ivBuffer, 0, 16, 0);
  await fd.close();

  let keyBuffer = Buffer.from(secretKey, "hex");
  if (keyBuffer.length !== 32) {
    keyBuffer = Buffer.concat([keyBuffer, Buffer.alloc(32 - keyBuffer.length)], 32); 
  }

  const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuffer, ivBuffer);
  input.pipe(decipher).pipe(output);
}


export async function getStreamByDecryptFile(inputPath: string, secretKey: string) {
  const fd = await fs.promises.open(inputPath, "r");
  const ivBuffer = Buffer.alloc(16);
  await fd.read(ivBuffer, 0, 16, 0);
  await fd.close();

  let keyBuffer = Buffer.from(secretKey, "hex");
  if (keyBuffer.length !== 32) {
    keyBuffer = Buffer.concat([keyBuffer, Buffer.alloc(32 - keyBuffer.length)], 32);
  }

  const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuffer, ivBuffer);
  decipher.setAutoPadding(true);

  const input = fs.createReadStream(inputPath, { start: 16 });
  return input.pipe(decipher);
}



export function hashSHA256(data: string){
  return crypto.createHash("sha256").update(data).digest("hex");
}



export async function zipFolder(folderPath: string, zipPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    output.on('close', () => {
      console.log(`Successfully compressed ${archive.pointer()} bytes into file ${zipPath}`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(folderPath, false);
    archive.finalize();
  });
}



export async function unzipFile(zipPath: string, extractPath: string): Promise<void> {
  console.log(`🔓 Extracting "${zipPath}" to "${extractPath}"...`);
  try {
    await fs.promises.mkdir(extractPath, { recursive: true });
    await extract(zipPath, { dir: path.resolve(extractPath) });
    console.log(`✅ Successfully extracted from "${zipPath}" to "${extractPath}"`);
  } catch (error) {
    console.error('❌ Error during extraction:', error);
  }
}


export async function listFileNamesInZip(zipPath: string): Promise<string[]> {
  const fileNames: string[] = [];
  
  const zip = await yauzl.open(zipPath);

  try {
    for await (const entry of zip) {
      if (!entry.filename.endsWith('/')) {
        fileNames.push(entry.filename);
      }
    }
  } catch (error) {
    console.error("Error reading ZIP file:", error);
  } finally {
    await zip.close();
  }

  return fileNames;
}



export async function getFileByNameInZip(zipPath: string, fileName: string, outputDir: string): Promise<string | null> {
  const zip = await yauzl.open(zipPath);
  let extractedFilePath: string | null = null;

  try {
    for await (const entry of zip) {
      if (entry.filename === fileName) {
        const readStream = await entry.openReadStream();
        const outputPath = path.join(outputDir, fileName);
        
        const writeStream = fs.createWriteStream(outputPath);

        readStream.pipe(writeStream);

        writeStream.on('finish', () => {
          // console.log(`File ${fileName} has been extracted to ${outputPath}`);
          extractedFilePath = outputPath;
        });

        writeStream.on('error', (err) => {
          console.error("Error writing file:", err);
          extractedFilePath = null; 
        });

        await new Promise<void>((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        break;
      }
    }

    if (!extractedFilePath) {
      console.log(`File ${fileName} not found in ZIP.`);
    }
    
  } catch (error) {
    console.error("Error reading ZIP file:", error);
    extractedFilePath = null; 
  } finally {
    await zip.close();
  }

  return extractedFilePath; 
}




export function caesarEncrypt(text: string, shift: number): string {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const index = characters.indexOf(char);

    if (index !== -1) {
      const newIndex = (index + shift + characters.length) % characters.length;
      result += characters[newIndex];
    } else {
      result += char;
    }
  }

  return result;
}



export function caesarDecrypt(text: string, shift: number): string {
  return caesarEncrypt(text, -shift);
}



export interface ProcessFileOptions {
  hash: string;
  zipPath?: string;
  folderPath?: string;
  encFile: string;
  outputFileName: string;
  destPath: string;
  returnStream?: boolean;
}



export const extractAndDecryptFileInZip = async ({
  hash,
  zipPath,
  encFile,
  outputFileName,
  destPath,
}: ProcessFileOptions) => {
  if (!zipPath || !fs.existsSync(zipPath)) {
    console.error("ZIP path is required or does not exist.");
    return null;
  }
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true });
  }

  const encFilePath = await getFileByNameInZip(zipPath, encFile, destPath);
  if (!encFilePath) return null;

  await decryptFile(`${destPath}/${encFile}`, `${destPath}/${outputFileName}`, hash);

  if (fs.existsSync(encFilePath)) {
    fs.rmSync(encFilePath, { recursive: true, force: true });
  }

  const outputFilePath = path.join(destPath, outputFileName);

  return {
    path: outputFilePath,
    stream: () => fs.createReadStream(outputFilePath),
    remove: () => {
      if (fs.existsSync(outputFilePath)) {
        fs.rmSync(outputFilePath, { recursive: true, force: true });
        console.log(`Temp file deleted: ${outputFilePath}`);
      }
    }
  };
};




export const extractAndDecryptFileInFolder = async ({
  hash,
  folderPath,
  encFile,
  outputFileName,
  destPath,
}: ProcessFileOptions) => {
  if (!folderPath || !fs.existsSync(folderPath)) {
    console.error("Folder path is required or does not exist.");
    return null;
  }
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true });
  }

  const files = await fs.promises.readdir(folderPath);
  const encFilePath = files.find(file => file === encFile);
  if (!encFilePath) return null;

  const encFileFullPath = path.join(folderPath, encFile);

  await decryptFile(encFileFullPath, `${destPath}/${outputFileName}`, hash);

  if (fs.existsSync(encFileFullPath)) {
    fs.rmSync(encFileFullPath, { recursive: true, force: true });
    console.log(`File ${encFile} has been deleted.`);
  }

  const outputFilePath = path.join(destPath, outputFileName);

  return {
    path: outputFilePath,
    stream: () => fs.createReadStream(outputFilePath),
    remove: () => {
      if (fs.existsSync(outputFilePath)) {
        fs.rmSync(outputFilePath, { recursive: true, force: true });
        console.log(`Temp file deleted: ${outputFilePath}`);
      }
    }
  };
};




export const encryptAndZipFolder = async (
  inputFolderPath: string,
  tempEncryptedFolderPath: string,
  zipOutputPath: string,
  hash: string
) => {
  try {
    await encryptFolder(inputFolderPath, tempEncryptedFolderPath, hash, true);
    await zipFolder(tempEncryptedFolderPath, zipOutputPath);

    if (fs.existsSync(tempEncryptedFolderPath)) {
      fs.rmSync(tempEncryptedFolderPath, { recursive: true, force: true });
      console.log(`Temp folder deleted: ${tempEncryptedFolderPath}`);
    }

    return zipOutputPath;
  } catch (err) {
    console.error("Failed to encrypt and zip folder:", err);
    return null;
  }
};


export function measureTime(fn: () => void): number {
  const start = process.hrtime();
  
  fn();

  const diff = process.hrtime(start);
  const elapsedMs = diff[0] * 1000 + diff[1] / 1e6;
  
  console.log(`⏱ Took ${elapsedMs.toFixed(3)}ms`);
  return elapsedMs; 
}


