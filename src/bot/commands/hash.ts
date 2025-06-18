import crypto from "crypto";

const hashText = (algorithm: string, text: string) => {
  return crypto.createHash(algorithm).update(text).digest("hex");
};

export default {
  info: {
    name: "hash",
    description: "Mã hóa văn bản bằng các thuật toán băm",
    usage: "hash <md5|sha1|sha256|sha512> <text>",
    example: [
      "hash md5 hello",
      "hash sha256 bí mật",
    ],
    version: "1.0.0",
    prefix: true,
    hidden: true,
    aliases: ["băm", "mahoa", "mãhóa"],
    credits: "NPK31"
  },

  execute: async ({api, message, parsedMessage}) =>{
    const args = parsedMessage.args;
    const algorithm = args[1]?.toLowerCase();
    const text = args.slice(2).join(" ");

    const supported = ["md5", "sha1", "sha256", "sha512"];

    if (!algorithm || !text) {
      return api.sendMessage("⚠️ Dùng như này nè: `hash <md5|sha1|sha256|sha512> <văn bản>`", message.threadID);
    }

    if (!supported.includes(algorithm)) {
      return api.sendMessage(`❌ Loại hash không hợp lệ. Hỗ trợ: ${supported.join(", ")}`, message.threadID);
    }

    try {
      const hashed = hashText(algorithm, text);
      return api.sendMessage({
        body: `🔐 ${algorithm.toUpperCase()}:\n${hashed}`,
        avoid: {
          obfuscate: false
        }
      }, message.threadID)
    } catch (err) {
      console.error("Hash command error:", err);
      return api.sendMessage("🚫 Có lỗi xảy ra khi hash văn bản!", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
