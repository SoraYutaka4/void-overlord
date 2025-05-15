import Jimp from "jimp";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

interface ImageData {
    width: number;
    height: number;
    bgColor: string;
    images: string[];
    outputDir?: string;  
    outputFileName?: string;
    offsetX?: number; 
    offsetY?: number; 
    paddingX?: number; 
    paddingY?: number; 
    returnType: 'buffer' | 'stream' | 'file'; 
}

const isValidImagePath = (imagePath: string): boolean => {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const extname = path.extname(imagePath).toLowerCase();
    
    if (!validExtensions.includes(extname)) {
        console.error(`❌ Invalid image format: ${imagePath}. Supported formats: .jpg, .jpeg, .png, .gif.`);
        return false;
    }

    if (!fs.existsSync(imagePath)) {
        console.error(`❌ Image path does not exist: ${imagePath}`);
        return false;
    }

    return true;
};

export async function mergeImage(info: ImageData): Promise<Buffer | Readable | string> {
    const { width, height, bgColor, images, outputDir, outputFileName = 'output.png', offsetX = 10, offsetY = 10, paddingX = 20, paddingY = 20, returnType } = info;
    
    const canvasWidth = width - 2 * paddingX; 
    const canvasHeight = height - 2 * paddingY;

    const canvas = new Jimp(canvasWidth, canvasHeight, bgColor);

    const validImages = images.filter(isValidImagePath);

    if (validImages.length !== images.length) {
        console.error('❌ Some images were skipped due to invalid paths or formats.');
    }

    const imagePromises = validImages.map((imagePath) => Jimp.read(imagePath));
    const loadedImages = await Promise.all(imagePromises);

    let currentX = paddingX; 
    let currentY = paddingY; 

    loadedImages.forEach((image) => {
        if (currentX + image.bitmap.width > canvasWidth) {
            currentX = paddingX; 
            currentY += image.bitmap.height + offsetY;
        }

        canvas.composite(image, currentX, currentY);

        currentX += image.bitmap.width + offsetX;
    });

    const buffer = await canvas.getBufferAsync(Jimp.MIME_PNG);

    if (outputDir) {
        const dirPath = path.resolve(outputDir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true }); 
        }
    }

    if (returnType === 'file' && outputDir) {
        const outputPath = path.resolve(outputDir, outputFileName);
        fs.writeFileSync(outputPath, buffer); 
        return outputPath; 
    }

    if (returnType === 'stream') {
        const stream = Readable.from(buffer);
        return stream;
    }

    return buffer;
}
