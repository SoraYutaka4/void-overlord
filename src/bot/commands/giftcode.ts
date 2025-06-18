import { writeFileSync, readFileSync } from "fs";
import path from "path";
import { isUserError } from "../controllers/usersManager";

const giftcodePath = path.join(__dirname, "../cache/giftcodes.json");

interface Giftcode {
  code: string;
  reward: { money: number };
  usedBy: string[];
}

function loadGiftcodes(): Giftcode[] {
  try {
    return JSON.parse(readFileSync(giftcodePath, "utf-8"));
  } catch {
    return [];
  }
}

function saveGiftcodes(data: Giftcode[]) {
  writeFileSync(giftcodePath, JSON.stringify(data, null, 2), "utf-8");
}

export default {
  info: {
    name: "giftcode",
    description: "Nhập code để nhận quà",
    version: "1.0.0",
    prefix: true,
    aliases: ["nhanqua", "nhanthuong"],
    category: "Fun",
    credits: "NPK31"
  },

  execute: async ({api, message, manager, parsedMessage}) => {
    const { args } = parsedMessage;
    const senderID = message.senderID;
    const threadID = message.threadID;
    const codeInput = args.slice(1).join(" ")?.toLowerCase();

    if (!codeInput) {
      return api.sendMessage("❌ Bạn chưa nhập mã giftcode!", threadID);
    }

    const codes = loadGiftcodes();
    const found = codes.find(c => c.code.toLowerCase() === codeInput);

    if (!found) {
      return api.sendMessage("❌ Mã giftcode không tồn tại hoặc đã hết hạn.", threadID);
    }

    if (found.usedBy.includes(senderID)) {
      return;
    }

    const rewardAmount = found.reward.money;
    const update = await manager.users.updateUser(senderID, "balance", rewardAmount);

    if (isUserError(update)) {
        return api.sendMessage("😔 Nhập giftcode rồi mà bot không có tiền để phát... cay thế nhờ", threadID);
    }

    found.usedBy.push(senderID);
    saveGiftcodes(codes);

    api.sendMessage(
      `🎁 Nhận thành công ${rewardAmount.toLocaleString()}$ từ mã: ${found.code}`,
      threadID
    );
  },
} satisfies import("../types").BotCommand;
