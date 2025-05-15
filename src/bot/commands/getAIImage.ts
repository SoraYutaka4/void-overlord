import puppeteer, { Page, Browser } from 'puppeteer';
import { translateText} from '../utils/langs';
import { BotCommand } from '../types';
import axios from "axios";



interface ApiResponse {
  images: { image_id: string }[]; 
}

async function getAPIDataFromPuppeteer(url: string): Promise<ApiResponse[]> {
  const browser: Browser = await puppeteer.launch({ headless: true });
  const page: Page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  const requests: ApiResponse[] = [];

  page.on('response', async (response) => {
    const requestUrl = response.url();
    console.log("step1");
    if (requestUrl.includes('/api2.craiyon.com/search')) { 
      try {
        console.log("step2");
        const text = await response.text();
        if (text.startsWith('<!DOCTYPE html>')) {
          console.error('Received HTML instead of JSON:', text);
        } else {
          const data: ApiResponse = JSON.parse(text); 
          requests.push(data); 

          console.log(data);
        }
      } catch (error) {
        console.error('Error parsing response:', error);
      }
    }
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await new Promise(resolve => setTimeout(resolve, 5000)); 

    return requests;
  } catch (error) {
    console.error('Error fetching API data:', error);
    return [];
  } finally {
    await browser.close();
  }
}

const info: BotCommand["info"] = {
  name: "-layanh",
  description: "Lấy ảnh AI có sẵn",
  version: "1.0.0",
  prefix: false,
  rules: {
    balance: 50000,
  },
  aliases: ["lấy ảnh", "get image", "lay anh", "get img"],
  category: "Fun",
  credits: "NPK31",
  disabled: true
}

export default {
  info,
  execute: async ({ api, message, parsedMessage, global }) => {
    try {
      const body = parsedMessage.body;
      const aliases: string[] = [...(info.aliases ?? []), ...(Array.isArray(info.name) ? info.name : [info.name])];
      const alias = aliases.find(alias => body.startsWith(alias));
      let content = body;

      if (alias) {
        content = body.slice(alias.length).trim();
      }

      if (!content) {
        return api.sendMessage("Cần cho mình mô tả về hình ảnh chứ, bạn ơi! 😅", message.threadID);
      }

      if (content.length > 100){
        return api.sendMessage("Nội dung dài quá, hãy thu gọn lại một chút nha! 😬", message.threadID);
      }

      if (!global.translationCache) {
        global.translationCache = {};
      }
      
      const getTranslatedText = async (content: string) => {
        if (global.translationCache[content]) {
          return global.translationCache[content];
        }
      
        const translatedText = await translateText(content, "en") ?? "";
        global.translationCache[content] = translatedText;
      
        return translatedText;
      };
      
      const translatedText = await getTranslatedText(content);

      const apiData = await getAPIDataFromPuppeteer(`https://api2.craiyon.com/search?text=${translatedText}&max_results=10`);
      const images = apiData.length > 0 && Array.isArray(apiData[0].images)
        ? apiData[0].images.map(img => `https://media.craiyon.com/${img.image_id}`).filter(url => url)
        : [];

      if (images.length === 0) {
        return api.sendMessage("Không có ảnh nào được tìm thấy từ mô tả của bạn! 🤷‍♂️", message.threadID);
      }

      const imageStreams = await Promise.allSettled(
        images.slice(0, 5).map(async (imageUrl) => {
          try {
            const response = await axios.get(imageUrl, { responseType: 'stream' });
            return response.data;
          } catch (error) {
            if (error instanceof Error) {
              console.error(`Error while downloading image from ${imageUrl}:`, error.message);
            } else {
              console.error(`Error while downloading image from ${imageUrl}:`);
            }
            return null;
          }
        })
      );

      const successfulStreams = imageStreams.filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<any>).value);

      if (successfulStreams.length === 0) {
        return api.sendMessage("Oops! Không có ảnh nào tải về thành công đâu! 😞", message.threadID);
      }

      return api.sendMessage({
        attachment: successfulStreams,
      }, message.threadID);

    } catch (error) {
      console.error("Error in execute function:", error);
      api.sendMessage("Đã có lỗi xảy ra khi lấy ảnh, thử lại sau nha! ✌️", message.threadID);
    }
  },
} satisfies BotCommand;
