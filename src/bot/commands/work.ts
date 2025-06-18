import { isUserError } from "../controllers/usersManager";

const jobs = [
  { title: "Quét sân trường", value: 22, imgUrl: "" },
  { title: "Phát tờ rơi ở công viên", value: 18, imgUrl: "" },
  { title: "Làm phục vụ quán trà đá", value: 38, imgUrl: "" },
  { title: "Dắt chó cho hàng xóm", value: 15, imgUrl: "" },
  { title: "Rửa xe thuê", value: 45, imgUrl: "" },
  { title: "Làm nhân viên bán vé số", value: 30, imgUrl: "" },
  { title: "Dạy kèm Toán lớp 1", value: 53, imgUrl: "" },
  { title: "Làm shipper giao hàng", value: 60, imgUrl: "" },
  { title: "Nhặt ve chai", value: 12, imgUrl: "" },
  { title: "Trông trẻ giúp hàng xóm", value: 27, imgUrl: "" },
  { title: "Làm cỏ vườn", value: 21, imgUrl: "" },
  { title: "Gấp quần áo thuê", value: 16, imgUrl: "" },
  { title: "Bán hàng rong", value: 33, imgUrl: "" },
  { title: "Tưới cây thuê", value: 14, imgUrl: "" },
  { title: "Giao báo buổi sáng", value: 28, imgUrl: "" },
  { title: "Phụ bán bún riêu", value: 34, imgUrl: "" },
  { title: "Lau kính cửa hàng", value: 20, imgUrl: "" },
  { title: "Dọn nhà theo giờ", value: 42, imgUrl: "" },
  { title: "Trông xe ở quán ăn", value: 24, imgUrl: "" },
  { title: "Phát tờ rơi ở trường học", value: 18, imgUrl: "" },
  { title: "Bơm bóng bay thuê", value: 25, imgUrl: "" },
  { title: "Phụ hồ", value: 53, imgUrl: "" },
  { title: "Phụ tiệm sửa xe", value: 41, imgUrl: "" },
  { title: "Chạy bàn quán nhậu", value: 45, imgUrl: "" },
  { title: "Làm mascot quảng cáo", value: 39, imgUrl: "" },
  { title: "Trông quán trà sữa", value: 36, imgUrl: "" },
  { title: "Giúp việc theo giờ", value: 44, imgUrl: "" },
  { title: "Chạy việc vặt", value: 20, imgUrl: "" },
  { title: "Làm thợ phụ sơn tường", value: 47, imgUrl: "" },
  { title: "Đóng gói hàng online", value: 30, imgUrl: "" },
  { title: "Canh giữ bãi đỗ xe", value: 27, imgUrl: "" },
  { title: "Tổ chức trò chơi cho trẻ", value: 33, imgUrl: "" },
  { title: "Dọn rác ở công viên", value: 15, imgUrl: "" },

  { title: "Coder freelance viết bot", value: 200, imgUrl: "" },
  { title: "Streamer YouTube", value: 240, imgUrl: "" },
  { title: "Làm video TikTok viral", value: 300, imgUrl: "" },
  { title: "Chạy ads Facebook thuê", value: 400, imgUrl: "" },
  { title: "Designer logo xịn", value: 500, imgUrl: "" },
  { title: "Lập trình app mobile", value: 600, imgUrl: "" },
  { title: "Edit video chuyên nghiệp", value: 440, imgUrl: "" },
  { title: "Làm content creator", value: 360, imgUrl: "" },
  { title: "Dạy kèm lập trình online", value: 540, imgUrl: "" },
  { title: "Quản lý fanpage triệu follow", value: 700, imgUrl: "" },
  { title: "Làm KOL quảng cáo", value: 800, imgUrl: "" },
  { title: "Xây dựng server Discord", value: 640, imgUrl: "" },
  { title: "Viết báo kiếm nhuận bút", value: 560, imgUrl: "" },
  { title: "Làm dropshipping", value: 900, imgUrl: "" },
  { title: "Phát triển game indie", value: 1000, imgUrl: "" },
  { title: "NFT artist", value: 1100, imgUrl: "" },
  { title: "Thợ ảnh chuyên nghiệp", value: 740, imgUrl: "" },
  { title: "Trader crypto", value: 1200, imgUrl: "" },
  { title: "Cố vấn đầu tư", value: 1400, imgUrl: "" },
  { title: "Startup founder", value: 2000, imgUrl: "" }
];


  
  const errorMessages = [
    "🤡 Hệ thống tính lương bị lỗi! Hình như sếp quên trả tiền cho bạn rồi...",
    "🚧 Tiền đang trên đường đến ví bạn... à không, hình như bị kẹt ở đâu đó!",
    "💸 Bạn làm quần quật nhưng số dư vẫn không thay đổi? Chắc do... định mệnh!",
    "🛠️ Hệ thống bị lag! Tiền của bạn đang bay lơ lửng trong không gian...",
    "📉 Cập nhật số dư thất bại... có thể do ngân hàng đang bảo trì!",
  ];

  export default {
    info: {
      name: "lamviec",
      description: "Đi làm kiếm tiền mỗi ngày",
      version: "1.0.0",
      prefix: true,
      aliases: ["work"],
      category: ["Fun", "Game"],
      credits: "NPK31"
    },
  
    execute: async ({api, message, manager, userInfo}) =>{
      try {
        const cooldown = manager.cooldowns.isOnCooldown(message.senderID, "work");
  
        if (cooldown.onCooldown) {
          const timeLeft = manager.cooldowns.getRemainingCooldown(message.senderID, "work");
          const minutes = Math.floor(timeLeft / 60000);
          const seconds = Math.floor((timeLeft % 60000) / 1000);
          return api.sendMessage(
            `⏳ Bạn đã làm việc rồi!\nVui lòng nghỉ ngơi một chút. Đợi ${minutes} phút ${seconds} giây nữa nhé!`,
            message.threadID
          );
        }
  
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const reward = Math.floor(job.value * Math.pow(1.35, userInfo.level));
  
        const updated = await manager.users.updateUser(message.senderID, "balance", reward );

        if (isUserError(updated)) {
            const errorMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
            return api.sendMessage(errorMessage, message.threadID);
        }
  
        manager.cooldowns.setCooldown(message.senderID, "work", 2 * 60 * 1000);
  
        api.sendMessage(
          `💼 Bạn vừa làm: ${job.title}\n💰 Nhận được: $${reward.toLocaleString()}`,
          message.threadID
        );
      } catch (err) {
        console.error(err);
        api.sendMessage("❌ Có lỗi khi đi làm, thử lại sau nhé! Đừng lo, không phải lỗi của bạn đâu 😅", message.threadID);
      }
   
},
  } satisfies import("../types").BotCommand;
  