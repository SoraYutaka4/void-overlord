export default {
    info: {
      name: "thuthach",
      description: "Thử thách",
      version: "1.0.0",
      prefix: true,
      credits: "NPK31",
      category: "Fun",
      aliases: ["thachthuc"]
    },
  
    execute: async ({ api, message }) => {
        const dares = [
            "Inbox crush nói 'Anh thích em' 💌",
            "Đổi avatar thành hình con mèo trong 24h 🐱",
            "Spam tin nhắn 'Tôi là trùm cuối' cho 3 người trong group 🤣",
            "Hát 1 câu bất kỳ trong group voice 🎤",
            "Tag 3 người bất kỳ và nói 'I love you' ❤️",
            "Gửi 1 meme dở nhất mà bạn có 📸",
            "Bật camera selfie chụp ngay lúc này 📷",
            "Kể 1 bí mật chưa từng nói ra 👀",
            "Bình luận 10 lần chữ 'Tao bá đạo' dưới bài post gần nhất của crush 📱",
            "Reaction care hoặc tim bài post gần nhất của người mày ghét 😏",
            "Inbox admin group nói 'Em yêu anh 😘'",
            "Gửi tin nhắn voice giả tiếng mèo kêu trong group 🐈",
            "Đổi tên nick thành 'Tôi là idol' trong 1 ngày 🌟",
            "Spam 5 tin nhắn toàn chữ hoa vào group (và bị mắng 😂)",
            "Inbox random 1 người và hỏi 'Ủa mày còn nhớ tao không?' 🤣",
            "Tự chụp mặt troll gửi vô group 😜",
            "Kể 1 chuyện xấu hổ hồi cấp 1/2/3 📚",
            "Gọi video call cho 1 đứa random trong danh bạ 📞",
            "Post story Instagram/Facebook với caption 'Tôi là con cưng vũ trụ' 🚀",
            "Đọc to 'Tôi yêu mọi người trong group này' rồi gửi voice vô group 😂"
          ];
  
      const randomDare = dares[Math.floor(Math.random() * dares.length)];
      await api.sendMessage(`🎯 Thử thách của bạn: ${randomDare}`, message.threadID);
    },
  } satisfies import("../types").BotCommand;
  