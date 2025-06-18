import Jimp from "jimp";
import path from "path";
import fs from "fs";

type SlotSymbol = string;

let imgSrcPath = "";
const p = (end: string, dir: string = imgSrcPath) => path.join(dir, end);

const symbolPath: Record<SlotSymbol, string> = {
    '🍒': "cherries.png",
    '🍋': "lemon.png",
    '🔔': "bell.png",
    '⭐': "star.png",
    '💎': "diamond.png",
    '7️⃣': "seven.png"
};

function groupByRow(coords: number[][]): Map<number, number[]> {
    const map = new Map<number, number[]>();
    for (const [row, col] of coords) {
        if (!map.has(row)) map.set(row, []);
        map.get(row)?.push(col);
    }
    return map;
}

function isDiagonal(coords: number[][]): boolean {
    if (coords.length <= 1) return true;

    const sorted = [...coords].sort((a, b) => a[1] - b[1]);

    const [firstRow, firstCol] = sorted[0];
    const [secondRow, secondCol] = sorted[1];

    const rowDiff = secondRow - firstRow;
    const colDiff = secondCol - firstCol;

    for (let i = 1; i < sorted.length - 1; i++) {
        const [prevRow, prevCol] = sorted[i];
        const [nextRow, nextCol] = sorted[i + 1];

        if ((nextRow - prevRow !== rowDiff) || (nextCol - prevCol !== colDiff)) {
            return false;
        }
    }

    const isHorizontal = sorted.every(([row], idx, arr) => row === arr[0][0]);
    const isVertical = sorted.every(([, col], idx, arr) => col === arr[0][1]);

    return !(isHorizontal || isVertical);
}

function shrinkLine(x1: number, y1: number, x2: number, y2: number, scale = 0.8) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const dx = (x2 - x1) * scale / 2;
  const dy = (y2 - y1) * scale / 2;

  const newX1 = midX - dx;
  const newY1 = midY - dy;
  const newX2 = midX + dx;
  const newY2 = midY + dy;

  return [newX1, newY1, newX2, newY2];
}


async function createImage(
    grid: SlotSymbol[][],
    outputPath: string,
    highlight?: number[][][],
) {
    try {
        const baseImg = await Jimp.read(p("bg2s.png"));
        const symbolSize = 100;
        const startX = 120;
        const startY = 95;
        const spacingX = 95;
        const spacingY = 65;

        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const symbol = grid[row][col];
                const fileName = symbolPath[symbol];
                if (!fileName) continue;

                const x = startX + col * (symbolSize + spacingX);
                const y = startY + row * (symbolSize + spacingY);

                let opacity = 0.9;  

                if (highlight && highlight.length !== 0){
                    if (highlight && highlight.flat().some(([hRow, hCol]) => hRow === row && hCol === col)) {
                        opacity = 1;  
                    } else {
                        opacity = 0.7; 
                    }
                }

                const symbolImg = await Jimp.read(p(fileName));
                symbolImg.resize(symbolSize, symbolSize);
                symbolImg.opacity(opacity);

                baseImg.composite(symbolImg, x, y);
            }
        }

        if (highlight && highlight.length > 0) {
          for (const line of highlight) {
              if (isDiagonal(line)) {
                  for (let i = 0; i < line.length - 1; i++) {
                      const [row1, col1] = line[i];
                      const [row2, col2] = line[i + 1];
      
                      const x1 = startX + col1 * (symbolSize + spacingX) + symbolSize / 2;
                      const y1 = startY + row1 * (symbolSize + spacingY) + symbolSize / 2;
                      const x2 = startX + col2 * (symbolSize + spacingX) + symbolSize / 2;
                      const y2 = startY + row2 * (symbolSize + spacingY) + symbolSize / 2;

                      const [sx1, sy1, sx2, sy2] = shrinkLine(x1, y1, x2, y2, 1.5);
      
                      const segment = new Jimp(baseImg.getWidth(), baseImg.getHeight(), 0x00000000);
                      const dx = sx2 - sx1;
                      const dy = sy2 - sy1;
                      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      
                      for (let j = 0; j <= steps; j++) {
                        const x = sx1 + (dx * j) / steps;
                        const y = sy1 + (dy * j) / steps;
                    
                        const ratio = j / steps;
                        const r = Math.round((1 - ratio) * 255 + ratio * 0);
                        const g = Math.round((1 - ratio) * 0 + ratio * 255);
                        const b = Math.round((1 - ratio) * 100 + ratio * 255);
                        const color = Jimp.rgbaToInt(r, g, b, 255);
                    
                        const length = Math.sqrt(dx * dx + dy * dy);
                        const nx = -dy / length;
                        const ny = dx / length;
                    
                        const thickness = 8; 
                        for (let t = -thickness; t <= thickness; t++) {
                            const px = Math.round(x + nx * t);
                            const py = Math.round(y + ny * t);
                            segment.setPixelColor(color, px, py);
                        }
                    }

                      baseImg.composite(segment, 0, 0);
                  }
              } else {
                  const rowGroups = groupByRow(line);
      
                  for (const [row, cols] of rowGroups) {
                      const sorted = cols.sort((a, b) => a - b);
                      const minCol = sorted[0];
                      const maxCol = sorted[sorted.length - 1];
                      const x1 = startX + minCol * (symbolSize + spacingX) - 25;
                      const x2 = startX + maxCol * (symbolSize + spacingX) + symbolSize + 30;
                      const y = startY + row * (symbolSize + spacingY) + symbolSize / 2;
      
                      const width = x2 - x1;
                      const lineHeight = 8;
      
                      const line = new Jimp(width, lineHeight, 0xff0329ff);
                      baseImg.composite(line, x1, y - lineHeight / 2);
                  }
              }
          }
      }
      

        await baseImg.writeAsync(outputPath);
        console.log("Image created at", outputPath);
    } catch (error) {
        console.error("Error creating image:", error);
    }
}

const symbolWeights: { symbol: SlotSymbol; weight: number }[] = [
  { symbol: '🍒', weight: 30 },
  { symbol: '🍋', weight: 25 },
  { symbol: '🔔', weight: 20 },
  { symbol: '⭐',  weight: 15 },
  { symbol: '💎', weight: 7 },
  { symbol: '7️⃣', weight: 3 }
];


const payouts: Record<SlotSymbol, Record<number, number>> = {
  '🍒': { 3: 1, 4: 2, 5: 3 },
  '🍋': { 3: 1, 4: 2, 5: 3 },
  '🔔': { 3: 2, 4: 4, 5: 6 },
  '⭐':  { 3: 3, 4: 6, 5: 9 },
  '💎': { 3: 5, 4: 10, 5: 20 },
  '7️⃣': { 3: 10, 4: 20, 5: 50 }, 
};


const paylines: [number, number][][] = [
  // horizontal
  [[0,0], [0,1], [0,2], [0,3], [0,4]],
  [[1,0], [1,1], [1,2], [1,3], [1,4]],
  [[2,0], [2,1], [2,2], [2,3], [2,4]],
  // diagonal
  [[0,0], [1,1], [2,2], [1,3], [0,4]],
  [[2,0], [1,1], [0,2], [1,3], [2,4]],
  // zigzac
  [[0,0], [1,1], [0,2], [1,3], [0,4]],
  [[2,0], [1,1], [2,2], [1,3], [2,4]],
  [[1,0], [0,1], [1,2], [2,3], [1,4]],
  [[1,0], [2,1], [1,2], [0,3], [1,4]],
  // wave
  [[0,0], [1,1], [2,2], [1,3], [0,4]],
  [[2,0], [1,1], [0,2], [1,3], [2,4]],
];

function getRandomSymbol(): SlotSymbol {
  const totalWeight = symbolWeights.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * totalWeight;

  for (const s of symbolWeights) {
    rand -= s.weight;
    if (rand < 0) return s.symbol;
  }

  return symbolWeights[0].symbol;
}

function spin(winBoost: number = 0.5): SlotSymbol[][] {
  const rows = 3;
  const cols = 5;
  const grid: SlotSymbol[][] = [];

  for (let row = 0; row < rows; row++) {
    const currentRow: SlotSymbol[] = [];
    let boostedSymbol: SlotSymbol | null = null;

    if (Math.random() < winBoost) {
      boostedSymbol = getRandomSymbol(); 
    }

    for (let col = 0; col < cols; col++) {
      if (boostedSymbol && Math.random() < winBoost) {
        currentRow.push(boostedSymbol);
      } else {
        currentRow.push(getRandomSymbol());
      }
    }

    grid.push(currentRow);
  }

  return grid;
}

function checkPaylines(grid: SlotSymbol[][], paylines: [number, number][][], betAmount: number) {
  const wins: {
    payline: number;
    symbol: SlotSymbol;
    count: number;
    reward: number;
    coordinates: [number, number][];
  }[] = [];
  let totalWin = 0;

  for (let i = 0; i < paylines.length; i++) {
    const line = paylines[i];
    const symbolsInLine = line.map(([row, col]) => grid[row][col]);

    const current = symbolsInLine[0];
    let count = 1;

    for (let j = 1; j < symbolsInLine.length; j++) {
      if (symbolsInLine[j] === current) {
        count++;
      } else {
        break;
      }
    }

    if (count >= 3) {
      const reward = payouts[current]?.[count] || 0;
      totalWin += reward * betAmount; 

      const coordinates = line.slice(0, count);

      wins.push({
        payline: i + 1,
        symbol: current,
        count,
        reward: reward * betAmount,
        coordinates,
      });
    }
  }

  return {
    grid,
    wins,
    totalWin,
  };
}


export default {
    info: {
      name: "-danhbac",
      description: "Máy đánh bạc - Quay lấy $, may rủi đến đâu, thử ngay!",
      version: "1.0.0",
      prefix: false,
      aliases: ["-slots", "-slot", "spin", "quay", "-spin"],
      rules: {
        balance: 1
      },
      usage: "quay <so tien>",
      example: [
        "quay 1000",
        "quay 1k",
        "quay 1m"
      ]
    },
  
    execute: async ({ api, message, manager, parsedMessage, parseAmount, userInfo }) => {
      const { args } = parsedMessage;
      const amount = parseAmount(args[1] ?? "");
  
      if (!amount || amount <= 0) {
        return api.sendMessage("⛔ Cược số tiền hợp lệ đi nhé.", message.threadID);
      }
  
      if (userInfo.balance < amount) {
        return api.sendMessage("⛔ Số dư của bạn không đủ để chơi rồi! Kiểm tra lại tài khoản nhé.", message.threadID);
      }
      
      imgSrcPath = p("slots", manager.publicPath)
  
      
      try {
          api.sendMessage({
            attachment: [fs.createReadStream(p("img/spin1.gif", manager.publicPath))]
          }, message.threadID, async (err, msgInfo) => {
                if (err) {
                    console.error("An error has occurred while sending GIF:", err);
                    return;
                }
        
                await manager.users.updateUser(message.senderID, "balance", -amount);
        
                const result = spin(0.5);
            
                const { wins, totalWin, grid } = checkPaylines(result, paylines, amount);
                const winPositions = wins.map(win => win.coordinates);
        
                const output = p("dist/slot.png", manager.publicPath);
        
                await createImage(grid, output, winPositions);
        
                const winMessages = [
                    "🎉 Bạn vừa trúng lớn, chúc mừng bạn! Hãy tiếp tục chiến đấu!",
                    "🔥 Chúc mừng, bạn là người may mắn! Tiền đã về túi rồi đó!",
                    "💰 Siêu may mắn, bạn đã thắng! Cứ thế mà chơi tiếp nhé!",
                    "🥳 Trúng rồi! Cùng tận hưởng chiến thắng nào!"
                ];
                    
                    const loseMessages = [
                    "💀 Ôi không, lần này không may rồi, nhưng đừng lo! Lần sau sẽ may mắn hơn!",
                    "😅 Lần này chưa may mắn, nhưng bạn sẽ chiến thắng lần sau thôi!",
                    "👀 Cố lên, may mắn sẽ đến vào lần tiếp theo!",
                    "💪 Đừng nản lòng, bạn sẽ thắng thôi!"
                ];
                
                if (wins.length > 0) {
                let winMessage = '\n🎉 Kết quả cực ngầu của bạn đây:\n';
                wins.forEach(win => {
                    winMessage += `🔥 Trúng dòng #${win.payline} với ${win.count} ${win.symbol} liên tiếp! +${win.reward.toLocaleString()} $ \n`;
                });
                winMessage += `\n💰 Tổng thưởng: $${totalWin.toLocaleString()}! Chúc mừng bạn! 🎉`;
                
                const randomWinMessage = winMessages[Math.floor(Math.random() * winMessages.length)];
                
                await new Promise((resolve) => setTimeout(resolve, 2500 + Math.random() * 1000)); 

                api.unsendMessage(msgInfo.messageID, (err) => {
                    if (err) console.error(err);
                });

                api.sendMessage({
                    body: `${randomWinMessage}\n${winMessage}`,
                    attachment: [fs.createReadStream(output)],
                    avoid: { obfuscate: false, delay: false }
                }, message.threadID);
                
                await manager.users.updateUser(message.senderID, "balance", totalWin);
                } else {
                    const randomLoseMessage = loseMessages[Math.floor(Math.random() * loseMessages.length)];
                    
                    await new Promise((resolve) => setTimeout(resolve, 2500 + Math.random() * 1000));

                    api.unsendMessage(msgInfo.messageID, (err) => {
                        if (err) console.error(err);
                    });

                    api.sendMessage({
                        body: `${randomLoseMessage}`,
                        attachment: [fs.createReadStream(output)],
                        avoid: { obfuscate: false, delay: false }
                    }, message.threadID);
                }
            
    
          });
      } catch (error) {
        console.error("Lỗi khi xử lý máy đánh bạc:", error);
        api.sendMessage("⛔ Ôi trời! Lỗi rồi, máy đánh bạc bị đứng. Thử lại chút nha!", message.threadID);
      }
    }
  } satisfies import("../types").BotCommand;
  
  