import { removeDiacritics, transformTextWithStyle } from "../utils";
import path from "path";
import fs from "fs";
import {
  chatWithCharacterById,
  createCharacter,
  editCharacter,
  removeCharacter,
  getUserCharacter,
  setUserCharacter,
  getAllCharacter
} from "../game/npc";

function getValueIgnoreCase(query: Record<string, any>, aliases: string[]): string {
  for (const key of aliases) {
    if (query[key]) return String(query[key]).toLowerCase();
  }
  return "";
}

export default {
  info: {
    name: ["npc", ">(\\s?.*)", "say"],
    description: "Chém gió với nhân vật yêu thích của bạn ✨",
    version: "1.0.0",
    prefix: false,
    hidden: true,
    rules: {
      balance: 10000
    },
    aliases: ["character", "talkto", "noichuyen"],
    credits: "NPK31"
  },

  execute: async ({api, message, manager, parsedMessage}) =>{
    const { body, args, query } = parsedMessage;
    const command = args[0].toLowerCase();
    const method = removeDiacritics(args[1]?.toLowerCase() || "");
    const uid = message.senderID;

    try {
      if (command === "npc") {
        const description = getValueIgnoreCase(query, ["mota", "des", "info", "description", "thongtin"]);
        const name = !description 
        ? getValueIgnoreCase(query, ["name", "tên", "ten"]) || args.slice(2).join(" ")
        : getValueIgnoreCase(query, ["name", "tên", "ten"]);

        if (["create", "add", "tao", "them", "make"].includes(method)) {
          if (!name || !description) return api.sendMessage("❌ Vui lòng nhập tên và mô tả.", message.threadID);
          const res = createCharacter(name, description, uid);
          return api.sendMessage(res, message.threadID);
        }

        else if (["edit", "sua", "chinh"].includes(method)) {
          if (!name || !description) return api.sendMessage("❌ Vui lòng nhập tên và mô tả mới.", message.threadID);
          const res = editCharacter(name, description, uid);
          return api.sendMessage(res, message.threadID);
        }

        else if (["remove", "delete", "xoa", "bo"].includes(method)) {
          if (!name) return api.sendMessage("❌ Vui lòng nhập tên nhân vật cần xoá.", message.threadID);
          const res = removeCharacter(name, uid);
          return api.sendMessage(res, message.threadID);
        }

        else if (["choose", "select", "chon", "pick"].includes(method)) {
          if (!name) return api.sendMessage("❌ Vui lòng nhập tên nhân vật bạn muốn chọn.", message.threadID);
          const res = setUserCharacter(uid, name);
          return api.sendMessage(res, message.threadID);
        }

        else {
          const list = getAllCharacter();

          const formattedList = list
            .map((n, index) => {
              const name = n.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

              const emoji = index % 2 === 0 ? "✨" : "🔥";
              return `${emoji} #${index + 1}: ${name}`;
            })
            .join("\n");

          const messageBody = `
          ${transformTextWithStyle("🎭 Hãy chọn nhân vật mà bạn muốn chat", "boldSansSerif")}

          ${formattedList}

          🕹 𝗛𝘂𝗼𝗻𝗴 𝗗ẫ𝗻:
          👉 Nhập lệnh: npc chọn tên=<tên nhân vật>
          🎯 Ví dụ: npc chọn tên=Goku
          `;

          return api.sendMessage({
            body: messageBody,
            attachment: [
              fs.createReadStream(path.join(manager.publicPath, "img", "popular_character.png"))
            ]
          }, message.threadID);

        }

      } else {
        const npcName = getUserCharacter(uid);
        if (!npcName) return api.sendMessage("⚠️ Bạn chưa chọn nhân vật! Dùng: npc chọn tên=<nhân vật>", message.threadID);

        await manager.users.updateUser(message.senderID, "balance", -10000);

        const content = body[0] === ">" ? body.slice(1) : args.slice(1).join(" ").trim();
        if (!content) return api.sendMessage("❌ Vui lòng nhập nội dung cần chat.", message.threadID);
      

        const reply = (await chatWithCharacterById(content, uid, npcName)).replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, '($1)')

        const npcNameUppercase = npcName.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

        return api.sendMessage({
          body: `꧁✦👤 ${transformTextWithStyle(npcNameUppercase, "italicSansSerif")}✦꧂\n╰┈➤ ${reply}`,
          avoid: {
            obfuscate: false
          }
        }, message.threadID);
      }

    } catch (error) {
      console.error("❌ Error in npc command:", error);
      return api.sendMessage("🚨 Đã xảy ra lỗi khi xử lý lệnh NPC.", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
