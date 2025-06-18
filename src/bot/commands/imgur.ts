import axios from 'axios';
import { get_API_Key } from '../../key';

const convertImageToBase64 = async (imageUrl: string) => {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

const uploadImg = async (url: string | string[]) => {
  const apiKeys = get_API_Key("IMGUR_CLIENT_ID");

  if (!apiKeys?.length){
    console.error("[IMGUR_CLIENT_ID] Missing Imgur API Keys.");
    return;
  }

  const IMGUR_CLIENT_ID = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  const uploadSingle = async (imageUrl: string) => {

    const base64Image = await convertImageToBase64(imageUrl);
    const res = await axios.post(
      'https://api.imgur.com/3/image',
      {
        image: base64Image,
        type: 'base64',
      },
      {
        headers: {
          Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
        },
      }
    );

    if (!res.data?.data?.link) throw new Error('Upload failed: ' + JSON.stringify(res.data));
    return res.data.data.link;
  };

  if (Array.isArray(url)) {
    return await Promise.all(url.map(uploadSingle));
  } else {
    return await uploadSingle(url);
  }
};

export default {
  info: {
    name: 'imgur',
    description: 'Đăng ảnh lên Imgur',
    version: '1.0.0',
    prefix: true,
    credits: "NPK31",
    category: "Tool"
  },

  execute: async ({ api, message, cprompt }) => {
    api.sendMessage(
      "👀 Gửi cho tớ 1 tấm ảnh bất kỳ đi, đang hónggg~",
      message.threadID
    );
  
    cprompt.create(message.senderID, async (message) => {
      const imgs: string[] = message.attachments
        .filter((item) => item.type === "photo" || item.type === "video")
        .map((item) => item.url);
  
      if (imgs.length > 0) {
        try {
          const uploadedImgs = await uploadImg(imgs);
          const links = Array.isArray(uploadedImgs)
            ? uploadedImgs.join("\n")
            : uploadedImgs;
  
          api.sendMessage(
            {
              body: `✨ Ảnh của bạn đã lên Imgur rồi nè:\n${links}`,
              avoid: { obfuscate: false },
            },
            message.threadID
          );
        } catch (error) {
          console.error("Failed to upload:", (error as any).data);
          api.sendMessage(
            "😢 Ụa lỗi rồi… Có thể do ảnh hư hoặc token bị sai á.",
            message.threadID
          );
        }
      } else {
        api.sendMessage(
          "😕 Tớ không thấy ảnh/video nào hết á… Gửi lại giúp tớ nha!",
          message.threadID
        );
      }
    });
  }
} satisfies import('../types').BotCommand;
