# 🤖 Void Overlord

![version](https://img.shields.io/badge/version-1.0.0-blue)
![license](https://img.shields.io/badge/license-GPL--3.0-green)
![issues](https://img.shields.io/github/issues/SoraYutaka4/void-overlord)
![stars](https://img.shields.io/github/stars/SoraYutaka4/void-overlord)

> 💬 A full-stack **Facebook Messenger Bot** built by [NPK31](https://github.com/SoraYutaka4) — tối ưu tốc độ, stealth, và trải nghiệm debug siêu mượt.

---

## 🚀 Main Features

- 💻 **Mini server riêng** — dễ deploy, hỗ trợ mở rộng
- 👓 **Web UI trực quan** — test & debug bot dễ dàng
- 🛡️ **Anti-Bot Detection** — hoạt động stealth, hạn chế checkpoint
- 📦 **Kiến trúc module** — dễ thêm lệnh, plugin, tích hợp AI
- 🔁 Hệ thống **queue + delay + cooldown** — xử lý mượt, chống spam


## ⚙️ Quick Install
```bash
git clone https://github.com/yourusername/void-overlord.git
cd void-overlord
npm install
```
⚠️ **Lưu ý**:

>Bạn cần cung cấp đầy đủ API Key trong file `src/key.json` và `TOGETHER_API_KEY` phải chứa ít nhất 2 API Key để đảm bảo hệ thống hoạt động ổn định.


## 🏃  Run bot
1. Thêm thông tin vào appstate.json.
2. Mở 2 terminal và chạy các lệnh sau:

    ```bash
    npm run server
    npm run bot
    ```


## 🔧 Debug / Testing
1. **Tương tự như trên, nhưng chạy ở chế độ dev:**

    ```bash
    npm run server
    npm run dev
    ```
2. **🔗 Truy cập Web UI**

    → Truy cập tại địa chỉ: [http://localhost:8000/chat](http://localhost:8000/chat)

3. **🪪 Nhập thông tin đăng nhập tại trang web**

    | Trường     | Giá trị          | Ghi chú                             |
    |------------|------------------|-------------------------------------|
    | **Your ID** | `acc1` – `acc10` | `acc1` → `acc3` là tài khoản admin |
    | **Room ID** | `bot`            | —                                  |

## 🤝 Contributing

Heyyy! Cảm ơn vì đã quan tâm tới dự án này 🫶  
Nếu bạn muốn góp chút sức, thì follow vài bước đơn giản sau là oke luôn:

1. **Fork** repo → tạo branch mới cho tính năng hoặc bug fix.
2. Viết code sạch, rõ ràng, có comment nếu cần.
3. Nhớ test kỹ trước khi gửi Pull Request (PR).
4. Trong Pull Request, ghi rõ bạn đã thay đổi gì nha.
5. Làm theo style chung của dự án để mọi thứ mượt mà hơn.

Nếu có thắc mắc gì, cứ mở issue hoặc nhắn trực tiếp cho mình nha 👀


## 📄 License

Licensed under the GNU GPL v3.0. See the [LICENSE](./LICENSE) file for details.