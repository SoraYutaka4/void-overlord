import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import validator from "validator";

export default {
  info: {
    name: "screenshot",
    description: "Chụp màn hình theo link hoặc tìm kiếm ",
    version: "1.2.0",
    prefix: true,
    aliases: ["screen", "chupmanhinh", "webshot", "anhweb", "capweb"],
    category: ["Tool", "Fun"],
    credits: "NPK31",
    usage: "screenshot <link|search> <url hoặc từ khóa>",
    cooldown: 7,
    example: "screenshot link https://google.com\nscreenshot search ảnh mèo cute",
    rules: {
      balance: 10000,
    }
  },

  execute: async ({api, message, manager, parsedMessage}) =>{
    const method = parsedMessage.args[1];
    const deviceType = parsedMessage.args[parsedMessage.args.length - 1].toLowerCase(); 
    const input = deviceType === "pc" ? parsedMessage.args.slice(2, parsedMessage.args.length - 1).join(" ").trim() : parsedMessage.args.slice(2).join(" ").trim(); 
    
    if (!["link", "search", "wiki"].includes(method) || !input) {
      return api.sendMessage("⚠️ Cú pháp sai rồi! Dùng:\n› screenshot link <url>\n› screenshot search <từ khóa>\n› screenshot wiki <từ khóa wiki>", message.threadID);
    }

    let targetURL = "";
    if (method === "link") {
      if (
        input.startsWith("http://localhost") ||
        input.startsWith("https://localhost") ||
        input.startsWith("http://127.0.0.1") ||
        input.startsWith("https://127.0.0.1") ||
        input.startsWith("http://[::1]") ||
        input.startsWith("https://[::1]") ||
        validator.isURL(input, { require_protocol: true })
      ) {
        targetURL = input;
      } else {
        return api.sendMessage("❌ URL không hợp lệ!", message.threadID);
      }
    } else if (method === "search") {
      const query = encodeURIComponent(input);
      targetURL = `https://duckduckgo.com/?q=${query}`;
    } else if (method === "wiki") {
      const query = encodeURIComponent(input);
      targetURL = `https://en.wikipedia.org/wiki/${query}`;
    }

    const fileName = `screenshot-${Date.now()}.png`;
    const outputPath = path.join(manager.publicPath, "dist", fileName);

    try {
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();

      if (deviceType === "pc") {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 }); 
      } else {
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
        await page.setViewport({ width: 375, height: 667 });  
      }

      await page.goto(targetURL, { waitUntil: "networkidle2", timeout: 60000 });

      await page.screenshot({ path: outputPath, fullPage: false });

      await browser.close();

      await manager.users.updateUser(message.senderID, "balance", -10000);

      api.sendMessage(
        {
          attachment: [fs.createReadStream(outputPath)],
          avoid: {
            delay: false
          }
        },
        message.threadID,
        () => fs.unlinkSync(outputPath) 
      );
    } catch (error) {
      console.error("Lỗi khi chụp screenshot:", error);
      api.sendMessage("❌ Đã xảy ra lỗi khi chụp ảnh!", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
