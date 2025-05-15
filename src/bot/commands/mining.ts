import path from "path";
import fs from "fs";

const inventoryPath = path.resolve(__dirname, "../cache/miner.json");

export interface Pickaxe {
  name: string;
  durability: number;
  minDrop: number;
  maxDrop: number;
  requiredExp: number;
  rate: number[];
  costRepair: number;
}

export interface Mineral {
  name: string;
  rarity: number;
  value: number;
  image: string;
  durability: number;
  danger?: string;
}

export interface MineralEntry {
  mineral: Mineral;
  amount: number;
}

export type Inventory = Map<string, { pickaxe: Pickaxe; minerals: Map<string, MineralEntry>; exp: number }>;

const ensureInventoryFile = (): void => {
  if (!fs.existsSync(inventoryPath)) {
    fs.writeFileSync(inventoryPath, JSON.stringify({}, null, 2), { encoding: "utf-8" });
  }
};

export const readInventory = (): Inventory => {
  ensureInventoryFile();
  try {
    const raw = fs.readFileSync(inventoryPath, "utf8");
    const data = JSON.parse(raw);
    const inventory = new Map<string, { pickaxe: Pickaxe; minerals: Map<string, MineralEntry>; exp: number }>();

    Object.entries(data).forEach(([userID, userInventory]) => {
      const typedUserInventory = userInventory as { pickaxe: Pickaxe; minerals: { mineral: Mineral; amount: number }[]; exp: number };
      inventory.set(userID, {
        pickaxe: typedUserInventory.pickaxe,
        minerals: new Map(typedUserInventory.minerals.map(({ mineral, amount }: MineralEntry) => [mineral.name, { mineral, amount }])),
        exp: typedUserInventory.exp ?? 0,
      });
    });

    return inventory;
  } catch (err) {
    console.warn("⚠️ Unable to read inventory.json:", err);
    return new Map();
  }
};

export const writeInventory = (inventory: Inventory): void => {
  try {
    const data = Object.fromEntries(Array.from(inventory.entries()).map(([userID, { pickaxe, minerals, exp }]) => [
      userID,
      { pickaxe, minerals: Array.from(minerals.values()), exp },
    ]));
    fs.writeFileSync(inventoryPath, JSON.stringify(data, null, 2), { encoding: "utf-8" });
  } catch (err) {
    console.error("❌ Error writing inventory:", err);
  }
};

export const getUserInventory = (userID: string): { pickaxe: Pickaxe; minerals: MineralEntry[]; exp: number } => {
  const inventory = readInventory();
  const user = inventory.get(userID);
  return user
    ? { pickaxe: user.pickaxe, minerals: Array.from(user.minerals.values()), exp: user.exp }
    : { pickaxe: pickaxes.wood, minerals: [], exp: 0 };
};

export const upgradePickaxe = (userID: string, oldPickaxeName: string, newPickaxe: Pickaxe): string => {
  const inventory = readInventory();
  const userInventory = inventory.get(userID);

  if (!userInventory) return `⚠️ Bạn chưa có kho đồ!`;
  if (!userInventory.pickaxe) return `⚠️ Bạn chưa có cuốc!`;
  if (userInventory.pickaxe.name === newPickaxe.name) return `⚠️ Bạn đã có cuốc ${newPickaxe.name} rồi!`;
  if (userInventory.pickaxe.name !== oldPickaxeName) return `⚠️ Không tìm thấy cuốc ${oldPickaxeName}!`;

  userInventory.pickaxe = newPickaxe;
  writeInventory(inventory);

  return `✅ Đã nâng cấp cuốc ${oldPickaxeName} thành ${newPickaxe.name}!`;
};

export const addMineral = (userID: string, mineral: Mineral, amount: number = 1): string => {
  const inventory = readInventory();
  let userInventory = inventory.get(userID);

  if (!userInventory) {
    userInventory = { pickaxe: pickaxes.wood, minerals: new Map(), exp: 0 };
    inventory.set(userID, userInventory);
  }

  const mineralEntry = userInventory.minerals.get(mineral.name);
  if (mineralEntry) {
    mineralEntry.amount += amount;
  } else {
    userInventory.minerals.set(mineral.name, { mineral, amount });
  }

  const sortedMinerals = new Map(
    [...userInventory.minerals.entries()].sort(([, a], [, b]) => b.mineral.value - a.mineral.value)
  );
  userInventory.minerals = sortedMinerals;

  writeInventory(inventory);
  return `✅ Đã thêm ${amount} ${mineral.name} vào kho.`;
};

export const removeMineral = (userID: string, mineralName: string, amount: number = 1): string => {
  const inventory = readInventory();
  const userInventory = inventory.get(userID);
  if (!userInventory) return `⚠️ Bạn chưa có kho đồ!`;

  const mineralEntry = userInventory.minerals.get(mineralName);
  if (!mineralEntry) return `⚠️ Không tìm thấy khoáng sản ${mineralName}!`;
  if (mineralEntry.amount < amount) return `⚠️ Bạn chỉ có ${mineralEntry.amount} ${mineralName}, không đủ để xóa ${amount}!`;

  mineralEntry.amount -= amount;
  if (mineralEntry.amount === 0) {
    userInventory.minerals.delete(mineralName);
  }

  writeInventory(inventory);
  return `✅ Đã xóa ${amount} ${mineralName} khỏi kho.`;
};

export const repairPickaxe = (userID: string, pickaxeName: string, amount: number = 100): string => {
  const inventory = readInventory();
  const userInventory = inventory.get(userID);
  if (!userInventory) return "⚠️ Bạn chưa có kho đồ!";
  if (!userInventory.pickaxe) return `⚠️ Bạn chưa có cuốc!`;

  const pickaxe = userInventory.pickaxe;
  if (pickaxe.name !== pickaxeName) return `⚠️ Không tìm thấy cuốc ${pickaxeName}!`;

  pickaxe.durability = amount;
  writeInventory(inventory);
  return `✅ Đã sửa cuốc ${pickaxeName} thành ${amount} độ bền.`;
};

export const updatePickaxeDurability = (userID: string, pickaxeName: string, amount: number): string => {
  const inventory = readInventory();
  const userInventory = inventory.get(userID);

  if (!userInventory) return "⚠️ Bạn chưa có kho đồ!";
  if (!userInventory.pickaxe) return `⚠️ Bạn chưa có cuốc!`;

  const pickaxe = userInventory.pickaxe;
  if (pickaxe.name !== pickaxeName) return `⚠️ Không tìm thấy cuốc ${pickaxeName}!`;

  pickaxe.durability = Math.max(pickaxe.durability - amount, 0);
  writeInventory(inventory);
  return `✅ Đã giảm ${amount} độ bền của ${pickaxeName}. Hiện tại: ${pickaxe.durability}`;
};

export const setUserExp = (userID: string, exp: number): string => {
  const inventory = readInventory();
  let userInventory = inventory.get(userID);
  if (!userInventory) {
    userInventory = { pickaxe: pickaxes.wood, minerals: new Map(), exp: 0 };
    inventory.set(userID, userInventory);
  }

  userInventory.exp = exp;
  writeInventory(inventory);
  return `✅ Đã đặt EXP của bạn thành ${exp}.`;
};

export const updateUserExp = (userID: string, expChange: number): string => {
  const inventory = readInventory();
  let userInventory = inventory.get(userID);

  if (!userInventory) {
    userInventory = { pickaxe: pickaxes.wood, minerals: new Map(), exp: 0 };
    inventory.set(userID, userInventory);
  }

  userInventory.exp = Math.max(userInventory.exp + expChange, 0);
  writeInventory(inventory);

  const action = expChange >= 0 ? `cộng thêm ${expChange}` : `trừ ${Math.abs(expChange)}`;
  return `✅ Đã ${action} EXP. Tổng EXP hiện tại: ${userInventory.exp}.`;
};







const createPickaxe = (name: string, durability: number, minDrop: number, maxDrop: number, requiredExp: number, rate: number[], costRepair: number): Pickaxe => ({
  name,
  durability,
  minDrop,
  maxDrop,
  requiredExp,
  rate,
  costRepair
});

const createMineral = (name: string, rarity: number, value: number, image: string, durability: number, danger: string = ''): Mineral => ({
  name,
  rarity: rarity - 1,
  value,
  image,
  durability,
  danger
});

const pickaxes = {
  // Basic tier
  wood:        createPickaxe("Cuốc gỗ", 50, 5, 10, 0, [100, 0, 0, 0, 0], 1000), // Sửa chữa: 1,000 đô
  stone:       createPickaxe("Cuốc đá", 100, 10, 20, 100, [90, 10, 0, 0, 0], 5000), // Sửa chữa: 5,000 đô
  copper:      createPickaxe("Cuốc đồng", 120, 15, 25, 700, [90, 10, 0, 0, 0], 10000), // Sửa chữa: 10,000 đô
  clay:        createPickaxe("Cuốc đất sét", 80, 8, 15, 400, [90, 10, 0, 0, 0], 8000), // Sửa chữa: 8,000 đô
  bamboo:      createPickaxe("Cuốc tre", 100, 12, 22, 600, [90, 10, 0, 0, 0], 9000), // Sửa chữa: 9,000 đô

  // Intermediate tier
  iron:        createPickaxe("Cuốc sắt", 200, 20, 40, 500, [70, 25, 5, 0, 0], 50000), // Sửa chữa: 50,000 đô
  lapis:       createPickaxe("Cuốc lapis", 300, 35, 60, 2000, [60, 30, 10, 0, 0], 75000), // Sửa chữa: 75,000 đô
  stonebrick:  createPickaxe("Cuốc gạch đá", 250, 25, 45, 1500, [80, 20, 0, 0, 0], 100000), // Sửa chữa: 100,000 đô
  ice:         createPickaxe("Cuốc băng", 200, 18, 32, 900, [80, 20, 0, 0, 0], 120000), // Sửa chữa: 120,000 đô
  terracotta:  createPickaxe("Cuốc gốm", 180, 20, 35, 1200, [80, 20, 0, 0, 0], 130000), // Sửa chữa: 130,000 đô
  slime:       createPickaxe("Cuốc slime", 250, 22, 40, 1300, [60, 30, 10, 0, 0], 150000), // Sửa chữa: 150,000 đô

  // Advanced tier
  gold:        createPickaxe("Cuốc vàng", 150, 30, 50, 1000, [50, 40, 10, 0, 0], 250000), // Sửa chữa: 250,000 đô
  diamond:     createPickaxe("Cuốc kim cương", 400, 50, 80, 3000, [30, 40, 20, 10, 0], 500000), // Sửa chữa: 500,000 đô
  quartz:      createPickaxe("Cuốc thạch anh", 400, 50, 90, 4000, [30, 30, 30, 10, 0], 800000), // Sửa chữa: 800,000 đô
  obsidian:    createPickaxe("Cuốc obsidian", 700, 90, 150, 12000, [50, 20, 20, 10, 0], 1500000), // Sửa chữa: 1,500,000 đô
  prismarine:  createPickaxe("Cuốc prismarine", 550, 70, 120, 10000, [20, 30, 30, 20, 0], 2000000), // Sửa chữa: 2,000,000 đô

  // Elite tier
  emerald:     createPickaxe("Cuốc ngọc lục bảo", 500, 60, 100, 5000, [10, 20, 40, 30, 0], 5000000), // Sửa chữa: 5,000,000 đô
  netherite:   createPickaxe("Cuốc Netherite", 600, 80, 130, 8000, [5, 10, 30, 50, 5], 7500000), // Sửa chữa: 7,500,000 đô

  // Super tier
  superDiamond:    createPickaxe("Cuốc kim cương siêu cấp", 1000, 200, 300, 20000, [0, 0, 30, 50, 20], 100000000), // Sửa chữa: 100,000,000 đô
  godly:          createPickaxe("Cuốc thần thánh", 1500, 300, 500, 30000, [0, 0, 25, 50, 25], 500000000), // Sửa chữa: 500,000,000 đô
  chaos:         createPickaxe("Cuốc hỗn loạn", 2000, 500, 800, 50000, [0, 0, 20, 50, 30], 1000000000), // Sửa chữa: 1,000,000,000 đô
  ultraNetherite:createPickaxe("Cuốc Netherite siêu cấp", 3000, 1000, 1500, 80000, [0, 0, 15, 50, 35], 5000000000), // Sửa chữa: 5,000,000,000 đô
  infinity:      createPickaxe("Cuốc vô cực", 9999999, 2000, 3000, 150000, [0, 0, 10, 50, 40], 10000000000), // Sửa chữa: 10,000,000,000 đô
};


const minerals = {
  coal: createMineral("Than đá", 1, 10, "coal.png", 5),
  iron: createMineral("Sắt", 1, 50, "iron.png", 10),
  rock: createMineral("Đá", 1, 5, "rock.png", 5),
  clay: createMineral("Đất sét", 1, 8, "clay.png", 5),
  salt: createMineral("Muối khoáng", 1, 12, "salt.png", 5),
  limestone: createMineral("Đá vôi", 1, 20, "limestone.png", 5),
  sand: createMineral("Cát", 1, 3, "sand.png", 5),
  sulfur: createMineral("Lưu huỳnh", 1, 30, "sulfur.png", 5),

  // Uncommon
  copper: createMineral("Đồng", 2, 150, "copper.png", 20),
  silver: createMineral("Bạc", 2, 100_000, "silver.png", 30),
  zinc: createMineral("Kẽm", 2, 200, "zinc.png", 25),
  tin: createMineral("Thiếc", 2, 300, "tin.png", 30),
  lead: createMineral("Chì", 2, 500, "lead.png", 35),
  nickel: createMineral("Niken", 2, 600, "nickel.png", 40),
  quartz: createMineral("Thạch anh", 2, 800, "quartz.png", 45),

  // Rare
  gold: createMineral("Vàng", 3, 500_000, "gold.png", 100),
  platinum: createMineral("Bạch kim", 3, 700_000, "platinum.png", 110),
  ruby: createMineral("Hồng ngọc", 3, 900_000, "ruby.png", 120),
  sapphire: createMineral("Lam ngọc", 3, 850_000, "sapphire.png", 120),
  opal: createMineral("Ngọc mắt mèo", 3, 950_000, "opal.png", 125),

  // Epic
  diamond: createMineral("Kim cương", 4, 1_200_000, "diamond.png", 150),
  emeral: createMineral("Ngọc lục bảo", 4, 800_000, "emeral.png", 150),
  obsidian: createMineral("Pha lê tím (Obsidian)", 4, 600_000, "obsidian.png", 120),
  amethyst: createMineral("Thạch anh tím", 4, 950_000, "amethyst.png", 125),
  topaz: createMineral("Hoàng ngọc", 4, 1_100_000, "topaz.png", 140),
  alexandrite: createMineral("Alexandrite", 4, 1_300_000, "alexandrite.png", 145),

  // Legendary
  uranium: createMineral("Uranium", 5, 3_000_000, "uranium.png", 200, "☢️ Phóng xạ cao, cần công cụ đặc biệt"),
  palladium: createMineral("Palladium", 5, 3_500_000, "palladium.png", 210),
  titanium: createMineral("Titan", 5, 4_000_000, "titanium.png", 230),
  meteorite: createMineral("Thiên thạch", 5, 5_000_000, "meteorite.png", 250, "☄️ Rơi từ không gian, siêu hiếm"),
  mythril: createMineral("Mythril", 5, 6_500_000, "mythril.png", 300, "✨ Kim loại huyền thoại, cực mạnh"),
  adamantite: createMineral("Adamantite", 5, 7_500_000, "adamantite.png", 320, "💥 Siêu cứng, dùng để chế tạo vũ khí thần thoại")
};


const randomMinerals = (pickaxe: Pickaxe) => {
  const { minDrop: min, maxDrop: max, rate } = pickaxe;
  const amount = Math.floor(Math.random() * (max - min + 1)) + min;
  const result: Record<string, { mineral: Mineral; amount: number }> = {};

  const rarityPools: Record<number, [string, Mineral][]> = {};
  Object.entries(minerals).forEach(([key, mineral]) => {
    const rarity = mineral.rarity;
    if (!rarityPools[rarity]) rarityPools[rarity] = [];
    rarityPools[rarity].push([key, mineral]);
  });

  const validRarities = rate
    .map((value, rarity) => ({ rarity, weight: value }))
    .filter(({ rarity, weight }) => weight > 0 && rarityPools[rarity]?.length > 0);

    if (validRarities.length === 0) return {};

  const totalWeight = validRarities.reduce((sum, r) => sum + r.weight, 0);

  const pickWeightedRarity = () => {
    let random = Math.random() * totalWeight;

    if (validRarities.length === 1) {
      return validRarities[0].rarity;
    }

    for (const { rarity, weight } of validRarities) {
      if (random < weight) return rarity;
      random -= weight;
    }

    return validRarities[0].rarity;
  };

  for (let i = 0; i < amount; i++) {
    const rarity = pickWeightedRarity();
    const mineralsInRarity = rarityPools[rarity];
    const [key, mineral] = mineralsInRarity[Math.floor(Math.random() * mineralsInRarity.length)];

    if (result[key]) {
      result[key].amount++;
    } else {
      result[key] = { mineral, amount: 1 };
    }
  }

  return result;
};


const getNextPickaxe = (pickaxe: Pickaxe) => {
  const sortedPickaxes = Object.values(Object.fromEntries(
    Object.entries(pickaxes)
    .sort(([, pickaxe1], [, pickaxe2]) => pickaxe1.requiredExp - pickaxe2.requiredExp)
  ));
  
  const currentIndex = sortedPickaxes.findIndex((item) => 
    item.requiredExp === pickaxe.requiredExp || item.name === pickaxe.name
  );
  
  return currentIndex !== -1 && currentIndex + 1 < sortedPickaxes.length 
    ? sortedPickaxes[currentIndex + 1]
    : null;
}




export default {
  info: {
    name: "-daomo",
    description: "Đào khoáng sản kiếm tiền",
    version: "1.0.0",
    prefix: false,
    category: "Game",
    customCooldown: true,
    aliases: ["đào", "sua cuoc", "sửa cuốc", "cuốc", "pickaxe", "-daokhoangsan", "-mining"]
  },

  execute: ({ api, message, manager, parsedMessage, normalizeText, userInfo, styleText, cprompt }) => {
    const { args, commandName } = parsedMessage;
    const cmdName = normalizeText(commandName ?? "");
    const method = normalizeText(
      ["dig", "dao"].includes(cmdName) ? "dig" : 
      cmdName === "sua cuoc" ? "fix" : 
      ["cuoc", "pickaxe"].includes(cmdName) ? "pickaxe":
      args[1] ?? ""
    );

    const updateMoney = (id: string, money: number) => manager.users.updateUser(id, "balance", money);

    try {


      if (["ruong", "tui", "kho", "bag", "inventory"].includes(method)) {
        const { minerals } = getUserInventory(message.senderID);
      
        if (minerals.length === 0) {
          return api.sendMessage("📦 Kho của bạn đang trống!", message.threadID);
        }
      
        let content = `「 ✦  ${styleText("Kho của bạn", "boldSansSerif")} ✦ 」\n`;
        for (let i = 0; i < minerals.length; i++) {
          const { mineral, amount } = minerals[i];
          content += `${i}. ${mineral.name} (${amount.toLocaleString()})\n`;
        }
      
        api.sendMessage(content.trim(), message.threadID);
      }




      else if (["cuoc", "pickaxe", "equip", "trangbi"].includes(method)) {
        const { pickaxe, exp } = getUserInventory(message.senderID);

        const nextPickaxe = getNextPickaxe(pickaxe);

        let response = `⛏️ Cuốc của bạn: ${pickaxe.name}\n💥 Độ bền: ${pickaxe.durability.toLocaleString()}\n`;

        if (nextPickaxe) {
          response += `\n🔜 Cuốc tiếp theo: ${nextPickaxe.name} (⚡ ${exp.toLocaleString()}/${nextPickaxe.requiredExp.toLocaleString()} )`;
        } else {
          response += `\n🎉 Bạn đã sở hữu cuốc xịn nhất rồi!`;
        }

        api.sendMessage(response, message.threadID);
      }




      else if (["sell", "ban"].includes(method)) {
        const { minerals } = getUserInventory(message.senderID);
      
        const indexArg = args[2]?.toLowerCase();
        const amountArg = args[3]?.toLowerCase();
      
        if (minerals.length === 0) {
          return api.sendMessage("📦 Khoáng sản của bạn đang trống, không có gì để bán.", message.threadID);
        }
      
        if (indexArg === "all") {
          api.sendMessage("⚠️ Bạn có chắc chắn muốn bán toàn bộ khoáng sản? (yes/no)", message.threadID);
        
          cprompt.create(message.senderID, (confirmMessage) => {
            const body = confirmMessage.body.trim().toLowerCase();
            const yesWords = ["yes", "y", "có", "co"];
            const noWords = ["no", "n", "không", "khong"];
        
            if (yesWords.includes(body)) {
              let totalMoney = 0;
              for (const { mineral, amount } of minerals) {
                const earned = mineral.value * amount;
                removeMineral(message.senderID, mineral.name, amount);
                totalMoney += earned;
              }
              updateMoney(message.senderID, totalMoney);
              return api.sendMessage(`✅ Đã bán toàn bộ khoáng sản và nhận được $${totalMoney.toLocaleString()}`, message.threadID);
            } else if (noWords.includes(body)) {
              return api.sendMessage("❌ Đã huỷ bán toàn bộ khoáng sản.", message.threadID);
            } else {
              return api.sendMessage("❓ Vui lòng trả lời yes hoặc no. Lệnh đã huỷ.", message.threadID);
            }
          }, 120000);

          return;
        }
      
        const index = parseInt(indexArg);
        let amountInput = null;
      
        if (isNaN(index) || index < 0 || index >= minerals.length) {
          return api.sendMessage("❌ Số thứ tự không hợp lệ.", message.threadID);
        }
      
        const { mineral, amount } = minerals[index];
      
        if (amountArg === "all") {
          amountInput = amount;
        } else {
          amountInput = parseInt(amountArg);
        }
      
        if (isNaN(amountInput) || amountInput <= 0) {
          return api.sendMessage("❌ Số lượng không hợp lệ.", message.threadID);
        }
      
        if (amountInput > amount) {
          return api.sendMessage(`❌ Bạn chỉ có ${amount.toLocaleString()} ${mineral.name}, không đủ để bán ${amountInput.toLocaleString()}.`, message.threadID);
        }
      
        const totalMoney = mineral.value * amountInput;
      
        removeMineral(message.senderID, mineral.name, amountInput);
        updateMoney(message.senderID, totalMoney);
      
        api.sendMessage(`✅ Đã bán ${amountInput.toLocaleString()} ${mineral.name} và nhận được $${totalMoney.toLocaleString()}!`, message.threadID);
      }




      else if (["sua", "fix"].includes(method)) {
        const { pickaxe: currentPickaxe } = getUserInventory(message.senderID);
        const pickaxe = Object.values(pickaxes).find((p) => p.name === currentPickaxe.name);
      
        if (!pickaxe) {
          api.sendMessage("❌ Không tìm thấy thông tin cuốc!", message.threadID);
          return;
        }
      
        const durabilityPercent = currentPickaxe.durability / pickaxe.durability;
      
        if (durabilityPercent >= 0.6) {
          api.sendMessage(`⛏️ Cuốc của bạn còn ${Math.round(durabilityPercent * 100)}% độ bền, chưa cần sửa!`, message.threadID);
          return;
        }
      
        if (userInfo.balance >= currentPickaxe.costRepair) {
          repairPickaxe(message.senderID, currentPickaxe.name, pickaxe.durability);
          updateMoney(message.senderID, -currentPickaxe.costRepair);
          api.sendMessage(`✅ Cuốc của bạn đã được sửa với phí ${currentPickaxe.costRepair.toLocaleString()} tiền.`, message.threadID);
        } else {
          api.sendMessage(`❌ Bạn không đủ tiền để sửa cuốc. Cần ${currentPickaxe.costRepair.toLocaleString()} tiền.`, message.threadID);
        }
      }




      else if (["dao", "dig"].includes(method)) {
        const { pickaxe } = getUserInventory(message.senderID);
      
        if (pickaxe.durability <= 0) {
          api.sendMessage("❌ Cuốc của bạn đã bị hỏng và không thể đào được nữa! 🔧", message.threadID);
          return;
        }
      
        const minerals = randomMinerals(pickaxe);
        let minedResponse = "";
        
        let remainingDurability = pickaxe.durability;
        let canMineAll = true;
        let brokenAt = null;
        const minedMinerals = [];
        const expPerDrop = 10;
      
        for (const [, { mineral, amount }] of Object.entries(minerals)) {
          const requiredDurability = amount * mineral.durability;
          if (remainingDurability < requiredDurability) {
            canMineAll = false;
            brokenAt = mineral.name;
            break;
          }
          remainingDurability -= requiredDurability;
          minedMinerals.push({ mineral, amount });
        }
      
        if (!canMineAll) {
          if (minedMinerals.length > 0) {
            minedResponse += "Bạn đã đào được:\n";  
            for (const { mineral, amount } of minedMinerals) {
              addMineral(message.senderID, mineral, amount);
              updateUserExp(message.senderID, amount * expPerDrop); 
              minedResponse += `🔹 ${amount.toLocaleString()}x ${mineral.name} (+${(amount * expPerDrop).toLocaleString()} EXP)\n`;
            }
          }
      
          updatePickaxeDurability(message.senderID, pickaxe.name, remainingDurability); 
          minedResponse = `❌ Cuốc của bạn bị hỏng khi đang đào ${brokenAt}! 🔧\n` + minedResponse;  

          const nextPickaxe = getNextPickaxe(pickaxe);
          const { exp } = getUserInventory(message.senderID);
          if (nextPickaxe && exp >= nextPickaxe.requiredExp) {
            upgradePickaxe(message.senderID, pickaxe.name, nextPickaxe);
            setUserExp(message.senderID, 100);
            minedResponse += `\n🎉 Chúc mừng! Cuốc của bạn đã được nâng cấp lên ${nextPickaxe.name}!`;
          }

          api.sendMessage({ body: minedResponse, avoid: { obfuscate: false } }, message.threadID);
          return;
        }
      
        let anyMineralMined = false;  
        for (const [, { mineral, amount }] of Object.entries(minerals)) {
          addMineral(message.senderID, mineral, amount); 
          updatePickaxeDurability(message.senderID, pickaxe.name, amount * mineral.durability);  
          updateUserExp(message.senderID, amount * expPerDrop); 
          minedResponse += `🔹 ${amount.toLocaleString()}x ${mineral.name}  (+${(amount * expPerDrop).toLocaleString()} EXP)\n`;
          remainingDurability -= amount * mineral.durability;
          anyMineralMined = true;  
        }
      
        if (anyMineralMined) {
          minedResponse = "💎 Bạn đã đào được:\n" + minedResponse;
        
          const nextPickaxe = getNextPickaxe(pickaxe);
          const { exp } = getUserInventory(message.senderID);
          if (nextPickaxe && exp >= nextPickaxe.requiredExp) {
            upgradePickaxe(message.senderID, pickaxe.name, nextPickaxe);
            setUserExp(message.senderID, 100);
            minedResponse += `\n🎉 Chúc mừng! Cuốc của bạn đã được nâng cấp lên ${nextPickaxe.name}!`;
          }
          
          api.sendMessage({ body: minedResponse, avoid: { obfuscate: false } }, message.threadID);
        }
      }



      
      else if (["gia", "price", "value"].includes(method)) {
        const { minerals } = getUserInventory(message.senderID);
      
        if (!minerals || Object.keys(minerals).length === 0) {
          api.sendMessage("❌ Bạn chưa có khoáng sản nào trong kho!", message.threadID);
          return;
        }
      
        let res = `「 ✦ ${styleText("Giá khoáng sản của bạn", "boldSansSerif")} ✦ 」\n`;
        let index = 0;
      
        for (const [, { mineral }] of Object.entries(minerals)) {
          const { name, value } = mineral;
          res += `${index++}. ${name.padEnd(12)} ( 💲${value.toLocaleString()} )\n`;
        }
      
        api.sendMessage(res, message.threadID);
      }

      else {
        const b = (str: string) => styleText(str, "boldSerif");
        api.sendMessage(
          "💎🎉 **Hướng dẫn sử dụng** 🎉💎\n\n" +
          "🪙 " + b("daomo kho") + "  -> Xem kho đồ\n" +
          "💵 " + b("daomo giá") + "  -> Xem giá khoáng sản\n" +
          "💰 " + b("daomo bán") + "  -> Bán khoáng sản\n" +
          "🔨 " + b("daomo cuốc") + " -> Xem cuốc\n" +
          "🛠️ " + b("daomo sửa") + "  -> Sửa cuốc\n" +
          "⛏️ " + b("daomo đào") + "  -> Đào khoáng sản",
          message.threadID
        );
      }

    } catch (error) {
      console.error("An error occurred while executing the mining command:", error);
      api.sendMessage("Đã xảy ra lỗi khi thực hiện lệnh!", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;