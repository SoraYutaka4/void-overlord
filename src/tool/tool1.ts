import Jimp from "jimp";
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);

if (!args[0] || !args[1]) {
  console.error("❌ Thiếu tham số. Cú pháp đúng là:");
  console.error("   node tool.js <input_folder> <output_folder> [keyword]");
  process.exit(1);
}

const inputDir = args[0]; // Thư mục ảnh đầu vào
const outputDir = args[1]; // Thư mục ảnh đầu ra
const keyword = args[2] || ""; // Từ khóa filter theo tên file (ví dụ: Montserrat)

const isNearBlack = (r: number, g: number, b: number, tolerance = 10) =>
  r < tolerance && g < tolerance && b < tolerance;

async function processImage(filePath: string, outputPath: string) {
  const img = await Jimp.read(filePath);

  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];

    if (isNearBlack(r, g, b)) {
      this.bitmap.data[idx + 3] = 0; // Set alpha = 0
    }
  });

  await img.writeAsync(outputPath);
}

async function run() {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const files = fs.readdirSync(inputDir)
    .filter(file => file.endsWith(".png"))
    .filter(file => keyword === "" || file.startsWith(keyword));

  if (files.length === 0) {
    console.log("⚠️ Không tìm thấy ảnh nào phù hợp để xử lý.");
    return;
  }

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);
    console.log("📷 Xử lý:", file);
    await processImage(inputPath, outputPath);
  }

  console.log("✅ Hoàn tất xóa vùng đen và lưu ảnh mới!");
}

run();