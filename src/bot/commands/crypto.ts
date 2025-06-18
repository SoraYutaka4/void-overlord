import { API, CommandMessage } from "../types";
import { isUserError } from "../controllers/usersManager";
import { UserErrorMessages } from "../types/user";
import Binance from "binance-api-node";
import path from "path";
import fs from "fs";
// import { execSync } from "child_process";






const crypto_UserDataPath = path.resolve(__dirname, "crypto/userData.json");

type CryptoWallets = Record<string, Record<string, number>>;

const readUserData = (): CryptoWallets => {
  if (!fs.existsSync(crypto_UserDataPath)) {
    return {};
  }

  const data = fs.readFileSync(crypto_UserDataPath, { encoding: "utf-8" });

  try {
    const parsedData = JSON.parse(data);

    if (typeof parsedData !== "object" || parsedData === null) {
      throw new Error("Invalid data: must be an object.");
    }

    Object.entries(parsedData).forEach(([userId, wallet]) => {
      if (typeof wallet !== "object" || wallet === null) {
        throw new Error(`Invalid wallet data for user ${userId}.`);
      }

      Object.entries(wallet).forEach(([coin, quantity]) => {
        if (typeof quantity !== "number" || quantity < 0) {
          throw new Error(`Invalid quantity for coin ${coin} of user ${userId}`);
        }
      });
    });

    return parsedData;
  } catch (error) {
    console.error("Error reading user data:", error);
    return {};
  }
};

const writeUserData = (data: CryptoWallets) => {
  try {
    fs.writeFileSync(crypto_UserDataPath, JSON.stringify(data, null, 2), { encoding: "utf-8" });
  } catch (error) {
    console.error("Error writing user data:", error);
  }
};


export const hasCoin = (userId: string, coin: string, amount: number): boolean => {
  const userData = readUserData();

  if (!userData[userId] || !userData[userId][coin] || userData[userId][coin] < amount) {
    return false;
  }

  return true;
};

export const coinCount = (userId: string, coin: string): number => {
  const userData = readUserData();
  const coins = userData[userId][coin]
  
  if (!coins) return 0;
  return coins;
};

const getUserCoins = (userId: string): Record<string, number> => {
  const userData = readUserData();
  
  if (!userData[userId]) {
    return {};
  }
  
  return userData[userId];
};

const addCoin = (userId: string, coin: string, amount: number) => {
  const userData = readUserData();

  if (!userData[userId]) {
    userData[userId] = {};
  }

  const userCoins = userData[userId];

  if (!userCoins[coin]) {
    userCoins[coin] = 0;
  }

  userCoins[coin] += amount;
  writeUserData(userData);

  return `✅ Bạn đã mua ${amount} ${coin}. Số lượng hiện tại của bạn: ${userCoins[coin]} ${coin}.`;
};

const reduceCoin = (userId: string, coin: string, amount: number) => {
  const userData = readUserData();

  if (!userData[userId]) {
    return `❗ Người dùng không tồn tại!`;
  }

  const userCoins = userData[userId];

  if (!hasCoin(userId, coin, amount)) {
    return `❗ Bạn không có đủ ${coin} để bán!`;
  }

  userCoins[coin] -= amount;

  if (userCoins[coin] === 0) {
    delete userCoins[coin];
  }

  writeUserData(userData);

  return `✅ Bạn đã bán ${amount} ${coin}! Số lượng ${coin} còn lại: ${userCoins[coin] || 0}`;
};












const client = Binance();

const getPrice = async (symbol: string): Promise<number> => {
  try {
    const data = await client.prices({ symbol });
    return Number(data[symbol]);
  } catch (error) {
    console.error("Error fetching price:", error);
    throw new Error("❗ Có lỗi khi lấy giá của đồng coin. Thử lại sau.");
  }
};


// const checkFileExistence = (filePath: string): boolean => {
//   if (!fs.existsSync(filePath)) {
//     console.error(`❗ File không tồn tại: ${filePath}`);
//     return false;
//   }
//   return true;
// };

// const runPythonScriptSync = (scriptPath: string, args: string[]) => {
//   try {
//     const result = execSync(`python "${scriptPath}" ${args.join(' ')}`, { encoding: 'utf-8' });
//     console.log(`stdout: ${result}`);
//   } catch (error) {
//     console.error(`exec error: ${error}`);
//   }
// };

// const createChart = async (symbol: string, theme: string[], saveDir: string, api: API, message: CommandMessage) => {
//   try {
//     const filePath = path.resolve(saveDir, "crypto_chart.py");
//     const chartFilePath = path.resolve(saveDir, "chart.png");

//     if (!fs.existsSync(saveDir)) {
//       fs.mkdirSync(saveDir, { recursive: true });
//     }

//     if (!checkFileExistence(filePath)) {
//       return api.sendMessage("❗ Không tìm thấy file Python script!", message.threadID);
//     }

//     runPythonScriptSync(filePath, 
//       ["--symbol", `${symbol}USDT`, "--output", `"${chartFilePath}"`].concat(theme)
//     );

//     if (!checkFileExistence(chartFilePath)) {
//       return api.sendMessage("❗ Lỗi khi tạo biểu đồ. Thử lại sau.", message.threadID);
//     }

//     api.sendMessage({
//       attachment: [fs.createReadStream(chartFilePath)],
//       avoid: {
//         delay: false
//       }
//     }, message.threadID);
//   } catch (error) {
//     console.error("Error creating chart:", error);
//     api.sendMessage("❗ Có lỗi khi tạo biểu đồ. Thử lại sau.", message.threadID);
//   }
// };

const crypto_symbol = {
  "BTC": ["btc", "bitcoin"],
  "ETH": ["eth", "ethereum"],
  "XRP": ["xrp", "ripple"],
  "SOL": ["sol", "solana"],
  "DOGE": ["doge", "dogecoin"],
  "LTC": ["ltc", "litecoin"],
};

export default {
    info: {
        name: "crypto",
        description: "Chơi tiền ảo 💸",
        version: "1.0.0",
        prefix: true,
        usage: 
          " `crypto list` - Xem danh sách các đồng coin hỗ trợ\n" +
          " `crypto price <coin>` - Xem giá của đồng coin\n" +
          " `crypto buy <coin> <số lượng>` - Mua đồng coin\n" +
          " `crypto sell <coin> <số lượng>` - Bán đồng coin",
        example: [
          " `crypto list` - Hiển thị danh sách các đồng coin hỗ trợ",
          " `crypto price btc` - Xem giá Bitcoin",
          " `crypto buy btc 5` - Mua 5 Bitcoin",
          " `crypto sell eth 3` - Bán 3 Ethereum"
        ],
        category: ["Info", "Game"],
        credits: "NPK31",
        disabled: true
    },
      

  execute: async ({api, message, manager, parsedMessage}) =>{
    const args = parsedMessage.args;
    const method = args[1];

    try {
        if (!method || !['list', 'price', 'chart', 'buy', 'sell', "have"].includes(method)) {
            return api.sendMessage(
              "❗ Vui lòng nhập phương thức hợp lệ:\n" +
              " `list`\n" +
              " `price <coin>`\n" +
              " `chart <coin>`\n" +
              " `buy <coin> <amount>`\n" +
              " `sell <coin> <amount>`\n" +
              " `have <coin | all>`\n",
              message.threadID
            );
          }

      if (method === "list") {
        try {
          const format = Object.entries(crypto_symbol)
            .map(([sym, aliases]) => `• ${aliases[1].charAt(0).toUpperCase() + aliases[1].slice(1)} (${sym})`)
            .join("\n");

          api.sendMessage(`📋 Danh sách đồng coin hỗ trợ:\n${format}`, message.threadID);
        } catch (error) {
          console.error("Error listing coins:", error);
          api.sendMessage("❗ Có lỗi khi liệt kê các đồng coin. Thử lại sau.", message.threadID);
        }
      }

      if (method === "have") {
        try {
            const input = args[2]?.toLowerCase();
            
            if (input === "all"){
                const userCoins = getUserCoins(message.senderID);

                if (Object.keys(userCoins).length === 0) {
                    api.sendMessage("❗ Bạn chưa sở hữu bất kỳ đồng coin nào!", message.threadID);
                } else {
                    let coinList = "📊 Các đồng coin bạn sở hữu:\n";
                    for (const [coin, amount] of Object.entries(userCoins)) {
                        coinList += `• ${coin}: ${amount}\n`;
                    }
                    api.sendMessage(coinList, message.threadID);
                }

                return;
            }

            const symbol = Object.entries(crypto_symbol).find(([, aliases]) =>
                aliases.includes(input)
            )?.[0];
        
            if (!symbol) {
                return api.sendMessage("❗ Không tìm thấy đồng coin nào trùng khớp!", message.threadID);
            }
        
            const count = coinCount(message.senderID, symbol);
            if (count > 0) {
                api.sendMessage(`📊 Bạn có ${count} ${symbol} trong ví của mình.`, message.threadID);
            } else {
                api.sendMessage(`❗ Bạn không có ${symbol} trong ví của mình!`, message.threadID);
            }
      
        } catch (error) {
          console.error("Error getting coin amount: ", error);
          api.sendMessage("❗ Đã có lỗi xảy ra, vui lòng thử lại sau.", message.threadID);
        }
      }


      if (method === "price") {
        try {
          const input = args[2]?.toLowerCase();
          const symbol = Object.entries(crypto_symbol).find(([, aliases]) =>
            aliases.includes(input)
          )?.[0];

          if (!symbol) {
            return api.sendMessage("❗ Không tìm thấy đồng coin nào trùng khớp!", message.threadID);
          }

          const price = await getPrice(symbol + "USDT");

          api.sendMessage(
            `💸 Giá hiện tại của ${symbol} là: $${price.toLocaleString()}`,
            message.threadID
          );
        } catch (error) {
          console.error("Error fetching price:", error);
          api.sendMessage("❗ Có lỗi khi lấy giá của đồng coin. Thử lại sau.", message.threadID);
        }
      }

      // if (method === "chart") {
      //   try {
      //     const input = args[2]?.toLowerCase();
      //     const symbol = Object.entries(crypto_symbol).find(([, aliases]) =>
      //       aliases.includes(input)
      //     )?.[0];

      //     const theme = args[3]?.toLowerCase() === "dark" ? ["--theme", "dark"] : [];

      //     if (!symbol) {
      //       return api.sendMessage("❗ Không tìm thấy đồng coin nào trùng khớp!", message.threadID);
      //     }

      //     api.sendMessage("😅 Đợi xíu, đang tạo biểu đồ, có thể sẽ hơi lâu...", message.threadID);

      //     const saveDir = path.resolve(__dirname, "crypto");

      //     await createChart(symbol, theme, saveDir, api, message);
      //   } catch (error) {
      //     console.error("Error creating chart:", error);
      //     api.sendMessage("❗ Có lỗi khi tạo biểu đồ. Thử lại sau.", message.threadID);
      //   }
      // }

      if (method === "buy") {
        try {
          const input = args[2]?.toLowerCase();
          const symbol = Object.entries(crypto_symbol).find(([, aliases]) =>
            aliases.includes(input)
          )?.[0];
          const amount = Number(args[3]);

          if (!symbol) {
            return api.sendMessage("❗ Không tìm thấy đồng coin nào trùng khớp!", message.threadID);
          }

          if (!amount || isNaN(amount) || amount <= 0) {
            return api.sendMessage("❗ Số lượng coin không hợp lệ!", message.threadID);
          }

          const user = await manager.users.getUserByID(message.senderID, true);

          if (isUserError(user)) return api.sendMessage(`[ERROR] ${UserErrorMessages.vi[user]}`, message.senderID);

          const price = Math.floor(await getPrice(symbol + "USDT"));
          const totalCost = price * amount;

          if (user.balance < totalCost) {
            return api.sendMessage(`❗ Bạn không đủ tiền để mua ${amount} ${symbol}!`, message.threadID);
          }

          console.log(totalCost);

          const updateBalance = await manager.users.updateUser(message.senderID, "balance", -totalCost);

          console.log(updateBalance);

          if (isUserError(updateBalance)) return api.sendMessage(`[ERROR] ${UserErrorMessages.vi[updateBalance]}`, message.senderID);

          const content = addCoin(message.senderID, symbol, amount);

          api.sendMessage(content, message.threadID);
        } catch (error) {
          console.error("Error buying coin:", error);
          api.sendMessage("❗ Có lỗi khi mua đồng coin. Thử lại sau.", message.threadID);
        }
      }

      if (method === "sell") {
        try {
          const input = args[2]?.toLowerCase();
          const symbol = Object.entries(crypto_symbol).find(([, aliases]) =>
            aliases.includes(input)
          )?.[0];
          const amount = Number(args[3]);

          if (!symbol) {
            return api.sendMessage("❗ Không tìm thấy đồng coin nào trùng khớp!", message.threadID);
          }

          if (!amount || isNaN(amount) || amount <= 0) {
            return api.sendMessage("❗ Số lượng coin không hợp lệ!", message.threadID);
          }

          const user = await manager.users.getUserByID(message.senderID, true);

          if (isUserError(user)) return api.sendMessage(`[ERROR] ${UserErrorMessages.vi[user]}`, message.senderID);
          if (!hasCoin(message.senderID, symbol, amount)) {
            return api.sendMessage(`❗ Bạn không có đủ ${symbol} để bán!`, message.threadID);
          }

          const price = Math.floor(await getPrice(symbol + "USDT"));
          const totalRevenue = price * amount;

          const updateBalance = await manager.users.updateUser(message.senderID, "balance", totalRevenue);

          if (isUserError(updateBalance)) return api.sendMessage(`[ERROR] ${UserErrorMessages.vi[updateBalance]}`, message.senderID);

          const content = reduceCoin(message.senderID, symbol, amount);

          api.sendMessage(content, message.threadID);
        } catch (error) {
          console.error("Error selling coin:", error);
          api.sendMessage("❗ Có lỗi khi bán đồng coin. Thử lại sau.", message.threadID);
        }
      }



    } catch (error) {
      console.error("General error:", error);
      api.sendMessage("❗ Đã xảy ra lỗi. Thử lại sau.", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
