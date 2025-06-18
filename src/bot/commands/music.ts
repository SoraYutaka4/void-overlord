import path from "path";
import { reloadModule } from "../utils";
import { getMusicAudio, getMusicLyrics, searchMusic, getMusicInfo } from "../controllers/requestToApi";

export default {
  info: {
    name: "music",
    description: "Nghe nhạc",
    version: "1.0.0",
    prefix: true,
    usage: "music search <tên bài hát>: Tìm kiếm bài hát\nmusic select <ID bài hát>: Phát bài hát theo ID từ kết quả tìm kiếm",
    example: "music search Em của ngày hôm qua\nmusic select 1",
    aliases: ["track", "song", "nhac"],
    cooldown: 7000,
    freeUse: true,
    category: "Fun",
    credits: "NPK31"
  },  

  execute: async ({api, message, parsedMessage, normalizeText, styleText}) =>{
    try {
      await reloadModule(path.join(__dirname, "../controllers/requestToApi"));
      const subCommand = normalizeText(parsedMessage.args[1] ?? "");

      if (["search", "tim", "find", "ten", "name"].includes(subCommand)) {
        const songName = parsedMessage.args.slice(2).join(" ");
        if (!songName) {
          return api.sendMessage("❌ Bạn chưa nhập tên bài hát!", message.threadID);
        }

        const data = await searchMusic(songName, "true", "stream");

        if (!data) {
          return api.sendMessage("⚠️ Đã xảy ra lỗi khi chọn bài hát!", message.threadID);
        }

        return api.sendMessage(
          {
            body: `🔍 Kết quả tìm kiếm cho: "${songName}"`,
            attachment: [data.data],
            avoid: {
              obfuscate: false,
              delay: false,
            }
          },
          message.threadID
        );
      }

      if (["select", "chon", "choose", "play", "phat", "choi"].includes(subCommand)) {
        const numSelected = Number(parsedMessage.args[2]);

        if (isNaN(numSelected) || numSelected < 1) {
          return api.sendMessage("❌ ID bài hát không hợp lệ!", message.threadID);
        }

        try {
          const trackInfo = await getMusicInfo(numSelected);

          if (!trackInfo || !trackInfo.preview_url) {
            return api.sendMessage("❌ Không tìm thấy bài hát!", message.threadID);
          }

          const data = await getMusicAudio(numSelected, "stream");

          if (!data) {
            return api.sendMessage("❌ Không thể tải nhạc!", message.threadID);
          }

          return api.sendMessage(
            {
              body: `🎶 Đang phát: ${trackInfo.name}\n🎤 Nghệ sĩ: ${trackInfo.artists}\n`,
              attachment: [data], 
              avoid: {
                obfuscate: false,
                delay: false,
                queue: 500
              }
            },
            message.threadID
          );
        } catch (err) {
          console.error("❌ Lỗi khi chọn bài hát:", err);
          return api.sendMessage("⚠️ Đã xảy ra lỗi khi chọn bài hát!", message.threadID);
        }
      }

      if (["lyric", "loi", "lyrics"].includes(subCommand)) {
        const numSelected = Number(parsedMessage.args[2]);
    
        if (isNaN(numSelected) || numSelected < 1) {
            return api.sendMessage("❌ ID bài hát không hợp lệ!", message.threadID);
        }
    
        let attempt = 0;
        const maxRetries = 3;
    
        while (attempt < maxRetries) {
            try {
                const data = await getMusicLyrics(numSelected);
    
                if (!data || !data.lyrics) {
                    console.warn(`⚠️ Attempt ${attempt + 1}: Không tìm thấy lời bài hát.`);
                } else {
                  const bold = (text: string) => text.replace(/\[([^\]]+)\]/g, (match, p1) => `==[${styleText(p1, "boldSerif")!}]==`);
                  
                  let formattedLyrics = data.lyrics;
                  formattedLyrics = bold(formattedLyrics);
                  
                  return api.sendMessage(
                      { 
                          body: formattedLyrics, 
                          avoid: { 
                              obfuscate: false, 
                              delay: false
                          }
                      },
                      message.threadID
                  );
                }
            } catch (error) {
                console.warn(`⚠️ Attempt ${attempt + 1}: Lỗi khi lấy lyrics`, (error as any)?.response?.status || (error as any)?.message || "Unknown error");
            }
    
            attempt++;
        }
    
        return api.sendMessage("❌ Đã xảy ra lỗi khi lấy lời bài hát, thử lại sau nhé!", message.threadID);
    }

      const bold = (text: string) => styleText(text, "boldSerif");

      const helpMsg = [
        "❗ " + bold("Lệnh không hợp lệ! Dùng:"),
        `👉 ${bold("music search")} <tên bài hát>`,
        `👉 ${bold("music play")} <STT>`,
        `👉 ${bold("music lyrics")} <STT>`
      ].join("\n");
      
      return api.sendMessage(helpMsg, message.threadID);
      

    } catch (err) {
      console.error("❌ Lỗi khi xử lý lệnh nhạc:", err);
      return api.sendMessage("⚠️ Đã xảy ra lỗi khi xử lý yêu cầu của bạn!", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
