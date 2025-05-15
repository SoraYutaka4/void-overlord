import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import axios from 'axios'; 

async function extractAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat("mp3")
      .on('end', () => {
        // console.log('Audio extraction finished');
        resolve();
      })
      .on('error', (err) => {
        console.error('Error during audio extraction:', err);
        reject(err);
      })
      .save(outputPath);
  });
}

async function getFileSize(url: string): Promise<number | null> {
    try {
      const response = await axios.head(url);
      const contentLength = response.headers['content-length'];
      
      if (contentLength) {
        return parseInt(contentLength, 10);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching file size:', error);
      return null;
    }
}
  

export default {
  info: {
    name: "amthanh",
    description: "Lấy âm thanh từ video",
    version: "1.0.0",
    prefix: true,
    usage: "<gửi video>",
    aliases: ["audio", "getaudio", "layamthanh"],
    cooldown: 7000
  },

  execute: async ({ api, message, manager, parsedMessage }): Promise<void> => {
    const attachment = message.attachments[0];

    if (!attachment || !attachment.url || attachment.type !== "video") {
        api.sendMessage("Vui lòng gửi video để lấy âm thanh.", message.threadID, undefined, message.messageID);
        return;
    }

    try {
        const videoPath = path.join(__dirname, "cache/generated", 'temp_video.mp4');
        const audioPath = path.join(__dirname, "cache/generated", 'temp_audio.mp3');
        
        if (!fs.existsSync(path.dirname(videoPath))) {
            fs.mkdirSync(path.dirname(videoPath), { recursive: true });
            console.log('Video directory created:', path.dirname(videoPath));
        }

        const videoUrl = attachment.url;
        const maxSize = 100 * 1024 * 1024;

        const fileSize = await getFileSize(videoUrl);
        if (fileSize && fileSize > 100 * 1024 * 1024) {
            api.sendMessage(`Video quá lớn, vui lòng gửi video nhỏ hơn ${maxSize}MB.`, message.threadID, undefined, message.messageID);
            return;
        }

        const response = await axios({
            method: 'get',
            url: videoUrl,
            responseType: 'arraybuffer'
        });

        fs.writeFileSync(videoPath, response.data);

        await extractAudio(videoPath, audioPath);
        
        await api.sendMessage({
            // body: "Đây là âm thanh bạn yêu cầu:",
            attachment: fs.createReadStream(audioPath),
        }, message.threadID, undefined, message.messageID);

        fs.unlinkSync(videoPath);
        fs.unlinkSync(audioPath);
      
    } catch (err) {
      console.error('Error processing video:', err);
      api.sendMessage("Đã có lỗi xảy ra trong quá trình xử lý video.", message.threadID, undefined, message.messageID);
    }
  },
} satisfies import("../types").BotCommand;
