export default {
    info: {
      name: "help",
      description: "Nhờ giúp đỡ.",
      aliases: ["h", "giup", "giupdo", "trogiup", "helper"],
      version: "1.1.0",
      prefix: true,
      category: ["Help", "Info"],
      credits: "NPK31"
    },
  
    execute: ({api, message}) =>{
      api.sendMessage(
        `🧾 Lệnh xài nhanh – dành cho bạn:
        
        ① <lệnh> use | huongdan  
        ⤷ Cách dùng cơ bản, khỏi phải mò
        
        ② <lệnh> ex | vidu  
        ⤷ Xem ví dụ thực tế, dùng cho lẹ
        
        ④ <lệnh> des | mota
        ⤷ Đọc kỹ hướng dẫn trước khi dùng 😤
        
        ⑤ <lệnh> alias | tenkhac
        ⤷ Kiểm tra các tên gọi khác
        `,
          message.threadID
        );
    },
  } satisfies import("../types").BotCommand;
  