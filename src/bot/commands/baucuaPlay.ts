import { randomInt } from "crypto";
import { isUserError } from "../controllers/usersManager";
import { API, CommandMessage, MessageInfo } from "../types";
import { mergeImage } from "../utils/imageMerger";
import fs from "fs";
import path from "path";

function removeDiacritics(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

type Animal = "bau" | "cua" | "ca" | "tom" | "nai" | "ga";

const randomAnimal = (): Animal => {
  const animals = ["bau", "cua", "ca", "tom", "nai", "ga"];
  return animals[randomInt(0, animals.length)] as Animal;
}

const getAnimalImagePath = (animal: Animal, publicSrc: string) => {
  const animalImages = {
    bau: "bau.gif",
    cua: "cua.gif",
    ca: "ca.gif",
    tom: "tom.gif",
    nai: "nai.jpg",
    ga: "ga.gif",
  };
  return path.join(publicSrc, "img", animalImages[animal]);
}


function parseAmount(input: string): number {
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

const sendResult = async (
  api: API, 
  message: CommandMessage, 
  resultMessage: string, 
  animalImages: (Buffer | fs.ReadStream | string)[], 
  messageInfo: MessageInfo
) => {
  try {
    const attachments = animalImages.map((imagePathOrBuffer) => {
      if (Buffer.isBuffer(imagePathOrBuffer)) {
        return imagePathOrBuffer; 
      } else if (typeof imagePathOrBuffer === 'string') {
        return fs.createReadStream(imagePathOrBuffer);
      } else {
        return imagePathOrBuffer as fs.ReadStream; 
      }
    });

    api.sendMessage({
      body: resultMessage,
      attachment: attachments,
    }, message.threadID, (err) => {
      if (err) {
        api.sendMessage("Oops! Có lỗi xảy ra khi gửi kết quả 😕", message.threadID);
        return;
      }

      if (messageInfo && messageInfo.messageID) {
        api.unsendMessage(messageInfo.messageID, (err) => {
          if (err) {
            return console.error(err);
          }
        });
      }
    });
  } catch (err) {
    api.sendMessage("Đã xảy ra sự cố 😓", message.threadID);
  }
}

const parseBets = (args: string[]): { [key: string]: number } | null => {
  const bets: { [key: string]: number } = {};

  for (let i = 0; i < args.length; i += 2) {
    const animalRaw = args[i];
    const amountRaw = args[i + 1];

    if (!animalRaw || !amountRaw) return null;

    const animal = removeDiacritics(animalRaw.toLowerCase());
    const betAmount = parseAmount(amountRaw);

    if (
      isNaN(betAmount) ||
      betAmount <= 0 ||
      !["bau", "cua", "ca", "tom", "nai", "ga"].includes(animal)
    ) {
      return null;
    }

    bets[animal] = betAmount;
  }

  return bets;
};


const animal_vi = {
  "bau": "bầu",
  "ca": "cá",
  "tom": "tôm",
  "ga": "gà",
}


export default {
  info: {
    name: [
      "bau", "cua", "ca", "tom", "nai", "ga",
      "bầu", "cá", "tôm", "gà"
    ],
    description: "Chơi Bầu Cua",
    cooldown: 7000,
    version: "1.0.0",
    prefix: false,
    hidden: true,
    customCooldown: true,
    rules: {
      balance: 1
    },
    credits: "NPK31"
  },

  execute: async ({api, message, manager, parsedMessage}) =>{
    try {
      const bets = parseBets(parsedMessage.args);

      if (!bets) {
        api.sendMessage("Thông tin cược không hợp lệ! Hãy kiểm tra lại cú pháp 😤", message.threadID);
        return;
      }

      const user = await manager.users.getUserByID(message.senderID, true);
      if (isUserError(user)) {
        api.sendMessage("Có lỗi xảy ra khi lấy thông tin người dùng", message.threadID);
        return;
      }

      const totalBet = Object.values(bets).reduce((acc, cur) => acc + cur, 0);
      if (totalBet > user.balance) {
        api.sendMessage("Số tiền cược vượt quá số dư của bạn! Vui lòng kiểm tra lại.", message.threadID);
        return;
      }

      let totalWinning = 0;
      let totalLoss = 0;
      let resultMessage = "";

      const randomAnimals = [randomAnimal(), randomAnimal(), randomAnimal()];

      const output = path.resolve(manager.publicPath, "dist", "bc.jpg");

      await mergeImage({
        images: randomAnimals.map(animal => getAnimalImagePath(animal, manager.publicPath)),
        width: 1520,
        height: 620,
        returnType: "file",
        outputFileName: "bc.jpg",
        outputDir: path.resolve(manager.publicPath, "dist"),
        bgColor: "#ffffff",
        offsetX: 30,
        offsetY: 30,
        paddingX: 50,
        paddingY: 50
      });

      const messageInfo = await api.sendMessage({
        attachment: [fs.createReadStream(path.join(manager.publicPath, "img", "baucua.gif"))]
      }, message.threadID) as MessageInfo;

      const randomAnimalCount = randomAnimals.reduce<Record<string, number>>((acc, cur) => {
        acc[cur] = (acc[cur] || 0) + 1;
        return acc;
      }, {});

      for (const [animalBet, betAmount] of Object.entries(bets)) {
        try {
          if (!messageInfo) {
            api.sendMessage("Hệ thống có vẻ gặp chút trục trặc rồi, thử lại sau nha 😓🚧", message.threadID);
            return;
          }

          if (randomAnimals.includes(animalBet as Animal)) {
            const reward = betAmount * randomAnimalCount[animalBet]
            totalWinning += reward;
            resultMessage += `Cược con ${animal_vi[animalBet as keyof typeof animal_vi] ?? animalBet} đúng! Nhận $${reward.toLocaleString()} 🤑\n`;
          } else {
            totalLoss += betAmount;
            resultMessage += `Cược con ${animal_vi[animalBet as keyof typeof animal_vi] ?? animalBet} sai! Mất $${betAmount.toLocaleString()} 😔\n`;
          }

          if (totalWinning > 0) {
            const updateBalance = await manager.users.updateUser(message.senderID, "balance", totalWinning);
            if (isUserError(updateBalance)) {
              api.sendMessage("Oops! Có lỗi khi cập nhật số dư", message.threadID);
              return;
            }
          }

          if (totalLoss > 0) {
            const updateBalance = await manager.users.updateUser(message.senderID, "balance", -totalLoss);
            if (isUserError(updateBalance)) {
              api.sendMessage("Oops! Có lỗi khi cập nhật số dư", message.threadID);
              return;
            }
          }

        } catch (err) {
          api.sendMessage("Đã xảy ra sự cố 😓", message.threadID);
          return;
        }
      }

      sendResult(
        api, message, resultMessage,
        [fs.createReadStream(output)], messageInfo
      );
  } catch (err) {
      console.error("Error in baucua command:", err);
      api.sendMessage("❌ Đã xảy ra lỗi trong quá trình thực hiện lệnh.", message.threadID);
    }
  },

} satisfies import("../types").BotCommand;
