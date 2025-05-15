import { UserErrorMessages } from "../types/user";
import { isUserError } from "../controllers/usersManager";
import path from "path";
import fs from "fs";

export function parseAmount(input: string): number {
  const baseUnits = ["k", "m", "b", "t", "q"];
  const extendedUnits: Record<string, number> = {};

  baseUnits.forEach((unit, i) => {
    extendedUnits[unit] = 10 ** ((i + 1) * 3);
  });

  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i < alphabet.length; i++) {
    for (let j = 0; j < alphabet.length; j++) {
      const suffix = alphabet[i] + alphabet[j];
      const power = 18 + (i * 26 + j) * 3;
      if (power > 308) break; 
      extendedUnits[suffix] = 10 ** power;
    }
  }

  const match = input.toLowerCase().match(/^([\d,.]+)([a-z]{0,2})$/);
  if (!match) return NaN;

  const [ , numStr, suffix ] = match;
  const cleanNum = parseFloat(numStr.replace(/,/g, ""));
  const multiplier = extendedUnits[suffix] || 1;

  return cleanNum * multiplier;
}

export default {
  info: {
    name: "cuop",
    description: "Cướp tiền người khác",
    version: "1.0.0",
    prefix: true,
    aliases: ["rob", "cướp"],
    rules: {
      balance: 2100,
    },
    category: ["Fun", "Game"],
    credits: "NPK31"
  },

  execute: async ({api, message, manager, parsedMessage, admin}) =>{
    try {
      const senderID = message.senderID;
      const mentions = message.mentions;
      const mentionID = Object.keys(mentions)[0]; 

      if (!mentionID) {
        api.sendMessage("⚠️ Bạn phải tag người muốn cướp!", message.threadID);
        return;
      }

      if (mentionID === senderID) {
        api.sendMessage("❌ Bạn không thể tự cướp chính mình!", message.threadID);
        return;
      }

      const amountArg = parsedMessage.args[parsedMessage.args.length - 1];
      if (!amountArg) {
        api.sendMessage("⚠️ Bạn phải nhập số tiền muốn cướp!", message.threadID);
        return;
      }

      const amount = parseAmount(amountArg);
      if (isNaN(amount) || amount <= 0) {
        api.sendMessage("⚠️ Số tiền không hợp lệ!", message.threadID);
        return;
      }

      const cooldown = manager.cooldowns.isOnCooldown(senderID, "rob");
      if (cooldown.onCooldown && !admin.is(message.senderID)) {
        api.sendMessage(
          `⏳ Chờ ${(cooldown.remaining / 1000).toFixed(1)} giây nữa để cướp tiếp!`,
          message.threadID
        );
        return;
      }

      const victim = await manager.users.getUserByID(mentionID);
      const robber = await manager.users.getUserByID(senderID);

      if (isUserError(victim)) {
        api.sendMessage(`❌ Không tìm thấy người dùng bị cướp\n Lỗi: ${UserErrorMessages.vi[victim]}`, message.threadID);
        return;
      }

      if (isUserError(robber)) {
        api.sendMessage(`❌ Không tìm thấy thông tin của bạn!\n Lỗi: ${UserErrorMessages.vi[robber]}`, message.threadID);
        return;
      }

      if (victim.balance < 5000) {
        api.sendMessage("😅 Người này nghèo quá, cướp chi vậy!", message.threadID);
        return;
      }

      if (amount > victim.balance) {
        api.sendMessage("❌ Người này không có nhiều tiền như vậy!", message.threadID);
        return;
      }


      const fine = Math.floor(amount * 0.15);
      if (robber.balance < fine) {
        api.sendMessage(
          `⚠️ Bạn cần có ít nhất $${fine.toLocaleString()} để chịu phạt nếu thất bại!`,
          message.threadID
        );
        return;
      }

      // ===== Fail rate calc =====
      const minFail = 0.4;
      const maxFail = 0.85;
      
      const ratio = amount / Number(victim.balance); // How much of the victim's balance is at stake
      let failRate = minFail + ratio * (maxFail - minFail); // Calculating the fail rate based on ratio
      failRate = Math.min(failRate, maxFail); // Ensure it doesn't exceed maxFail
      
      // If the victim's balance is really high compared to the amount, you might want to scale failRate more intensely:
      if (victim.balance > 100000000) { // Example: if balance is greater than 100k
        failRate += 0.05; // Increase fail rate a little more
      }
      
      const isFail = Math.random() < failRate; // Determine whether the action fail

      // console.log(`🚨 Vụ Cướp:
      //   👤 Số dư nạn nhân: $${victim.balance.toLocaleString()}
      //   🎯 Số tiền cướp: $${amount.toLocaleString()}
      //   📉 Tỉ lệ thất bại: ${(failRate * 100).toFixed(1)}%
      //   `);

      if (isFail) {
        const actualFine = Math.min(Number(robber.balance), fine); 
      
        const updated = await manager.users.updateUser(senderID, "balance", -actualFine);

        if (isUserError(updated)) {
          api.sendMessage(
            "Bạn thoát được vụ cướp, nhưng không thoát được lưới trời! 😏 (Lỗi khi trừ tiền phạt)",
            message.senderID
          );
          return;
        }
      
        let msg = `🚓 Bạn bị tóm khi cố cướp $${amount.toLocaleString()}!\n💀 Bị phạt $${actualFine.toLocaleString()} (${(
          (actualFine / amount) *
          100
        ).toFixed(1)}% số tiền muốn cướp)\n🔢 Tỉ lệ thất bại: ${(failRate * 100).toFixed(1)}%`;

        if (actualFine === 0) {
          msg += `\n💀 Bạn không có xu nào nên được thả, lần sau nhớ mang tiền đi cướp nhé!`;
        } else if (actualFine < fine) {
          msg += `\n💀 Bạn không đủ tiền nên bị tịch thu hết tiền!`;
        }
      
        api.sendMessage({
          body: msg,
          attachment: [fs.createReadStream(path.join(manager.publicPath, "img/defeat.jpg"))]
        }, message.threadID);
        manager.cooldowns.setCooldown(senderID, "rob", 60000);
        return;
      }

        const victimUpdate = await manager.users.updateUser(mentionID, "balance", -amount);
        if (isUserError(victimUpdate)) {
          api.sendMessage(
            "❌ Lỗi khi chuyển tiền từ người bị cướp! Có vẻ như người này có bùa hộ mệnh tài khoản. 😅",
            message.threadID
          );
          return;
        }

        const robberUpdate = await manager.users.updateUser(senderID, "balance", amount);
        if (isUserError(robberUpdate)) {
          api.sendMessage(
            "❌ Lỗi khi chuyển tiền cho bạn! Đời không như là mơ, đâu phải lúc nào cướp cũng thành công. 😎",
            message.threadID
          );
          return;
        }


      api.sendMessage(
        {
            body: 
              `💥 Bạn cướp được $${amount.toLocaleString()} từ ${(message.mentions?.[mentionID] ?? "").replace(
              "@",
              ""
            )}!\n🔥 Tỉ lệ thất bại: ${(failRate * 100).toFixed(1)}%`,
            attachment: [fs.createReadStream(path.join(manager.publicPath, "img/thief.jpg"))]
      },
        message.threadID
      );

      manager.cooldowns.setCooldown(senderID, "rob", 60000);
    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Có lỗi xảy ra khi cướp!", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
