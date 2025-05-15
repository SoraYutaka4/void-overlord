import { loadCommandFromUrl } from "../utils/file";
import path from "path";
import validator from "validator";

function getFileExtension(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

const isValidURL = (url: string) => {
  if (
    url.startsWith("http://localhost") ||
    url.startsWith("https://localhost") ||
    url.startsWith("http://127.0.0.1") ||
    url.startsWith("https://127.0.0.1") ||
    url.startsWith("http://[::1]") ||
    url.startsWith("https://[::1]")
  ) {
    return true;
  }
  return validator.isURL(url, { require_protocol: true });
};

export default {
  info: {
    name: "inject",
    description: "Nạp lệnh mới 😈",
    version: "1.0.0",
    prefix: true,
    hidden: true,
    permission: "admin",
    category: "Admin",
    credits: "NPK31"
  },

  execute: async ({api, message, manager, parsedMessage}) =>{
    try {
      const [, loadUrl, name] = parsedMessage.args;

      if (!loadUrl || !name) {
        return api.sendMessage("⚠️ Thiếu URL hoặc tên. Cú pháp đúng: `inject <url> <tên>` nha bro.", message.threadID);
      }

      if (!isValidURL(loadUrl)) {
        return api.sendMessage("❌ URL này nhìn mlem nhưng không hợp lệ đâu á. Check lại giùm.", message.threadID);
      }

      const extension = getFileExtension(loadUrl);
      if (extension !== "zip") {
        return api.sendMessage("📦 Chỉ nhận file `.zip` thôi nha. Mấy file khác không chơi.", message.threadID);
      }

      await api.sendMessage("⏳ Đang nạp lệnh... đợi xíu nha bro...", message.threadID);

      const save = path.resolve(__dirname, "..", "cache", "temp", name);
      const result = await loadCommandFromUrl(loadUrl, save, manager);

      if (!result.success) {
        return api.sendMessage(`Nạp lệnh không thành công, vui lòng thử lại\n[ERROR] ${result.message}`, message.threadID);
      }

      return api.sendMessage(`✅ Đã nạp lệnh ${name} thành công! Quẩy thôi 😈`, message.threadID);
    } catch (err) {
      console.error("Lỗi khi inject lệnh:", err);
      return api.sendMessage("💥 Oops, có gì đó sai sai khi nạp lệnh. Gọi dev đi bro 😭", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
