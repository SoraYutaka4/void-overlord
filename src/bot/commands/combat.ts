import { Power, UserErrorMessages } from "../types/user";
import { getPowerInfo } from "../controllers/requestToApi";
import { isUserError } from "../controllers/usersManager";

type CombatResult = "win" | "lose" | "draw";

function combatPower(userA: Power, userB: Power): CombatResult {
  const aHits = userA.attack > userB.defense;
  const bHits = userB.attack > userA.defense;

  if (aHits && !bHits) return "win";
  if (!aHits && bHits) return "lose";
  return "draw";
}

async function combatBetweenUsers(
  userIdA: string,
  userIdB: string
): Promise<{
  userA: Power;
  userB: Power;
  result: CombatResult;
}> {
  try {
    const [userA, userB] = await Promise.all([
      getPowerInfo(userIdA),
      getPowerInfo(userIdB),
    ]);

    if (isUserError(userA)) {
      console.error(UserErrorMessages.en[userA]);
      throw new Error("User A not found or error occurred.");
    }
    
    if (isUserError(userB)) {
      console.error(UserErrorMessages.en[userB]);
      throw new Error("User B not found or error occurred.");
    }

    return {
      userA,
      userB,
      result: combatPower(userA, userB),
    };
  } catch (err) {
    console.error("[combatBetweenUsers] Error:", err);
    throw err;
  }
}

export default {
  info: {
    name: "danhnhau",
    description: "Combat giữa bạn và người khác xem ai mạnh hơn 💥",
    version: "1.0.0",
    prefix: true,
    aliases: ["combat", "pvp", "fight", "rpg", "duel"],
    usage: "danhnhau @user",
    example: "danhnhau @NguyenVanA",
    cooldown: 6000,
    category: ["Fun", "Game"],
    credits: "NPK31"
  },

  execute: async ({api, message, manager}) =>{
    try {
      const mentionIds = Object.keys(message.mentions || {});
      if (mentionIds.length === 0 || mentionIds[0] === message.senderID) {
        return api.sendMessage(
          "❗ Bạn cần tag 1 người (không phải chính bạn) để combat.\nVí dụ: danhnhau @user",
          message.threadID
        );
      }

      const userIdA = message.senderID;
      const userIdB = mentionIds[0];

      const { userA, userB, result } = await combatBetweenUsers(userIdA, userIdB);

      const totalA = userA.attack + userA.defense;
      const totalB = userB.attack + userB.defense;

      let resultText = "";
      let expChange = 0;

      if (result === "win") {
        expChange = 10;
        resultText = `🥇 Bạn đã chiến thắng và nhận được +${expChange} EXP!`;
        await manager.users.updateUser(userIdA, "exp", expChange);

      } else if (result === "lose") {
        const user = await manager.users.getUserByID(userIdA, true);

        if (isUserError(user)) {
          console.error(UserErrorMessages.en[user]);
          return;
        }

        if (user.exp < 0){
          await manager.users.updateUser(userIdA, "exp", 0, true);
        }

        if (user.exp <= 0) {
          expChange = 0;
          resultText = `💀 Bạn đã thua cuộc nhưng không bị trừ EXP vì EXP hiện tại là ${user.exp}.`;
        } else {
          expChange = -5;
          resultText = `💀 Bạn đã thua cuộc và bị trừ ${Math.abs(expChange)} EXP!`;
          await manager.users.updateUser(userIdA, "exp", expChange);
        }

      } else {
        resultText = "⚔️ Trận đấu hòa! Không có EXP được cộng hoặc trừ.";
      }

      const replyMessage = `
🔥 𝐂𝐨𝐦𝐛𝐚𝐭 𝐑𝐞𝐬𝐮𝐥𝐭 🔥
👤 Bạn: ${userA.attack} ATK | ${userA.defense} DEF (Tổng: ${totalA})
👾 Đối thủ: ${userB.attack} ATK | ${userB.defense} DEF (Tổng: ${totalB})

${resultText}
`.trim();

      return api.sendMessage(replyMessage, message.threadID);

    } catch (err) {
      console.error("[danhnhau] Error:", err);
      return api.sendMessage("⚠️ Có lỗi xảy ra khi xử lý combat.", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
