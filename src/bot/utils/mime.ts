import { fileTypeFromBuffer } from "file-type";
import { extension } from "mime-types";

export async function getMimeTypeFromBase64(base64: string): Promise<string | null> {
    try {
        const buffer = Buffer.from(base64, "base64");
        const fileType = await fileTypeFromBuffer(buffer);
        return fileType?.mime ?? null;
    } catch (error) {
        console.error("❌ Lỗi khi xác định MIME type:", error);
        return null;
    }
}

export function mimeToExt(mimeType: string): string | null {
    return extension(mimeType) || null;
}
