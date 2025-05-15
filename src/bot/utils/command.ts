import fs from "fs";
import path from "path";
import { CM, Command, CommandMessage, ParsedMessage } from "../types";

export const getPrefix = () => readConfig().prefix;
export const setPrefix = (prefix: string) => {
  const config = readConfig();
  config.prefix = prefix;
  writeConfig(config);
}

export function resolveCommand(
  input: string,
  manager: CM,
  offlineOnly = false,
  isAdmin = false
): Command | undefined {
  const prefix = getPrefix();
  const lowerInput = input.trim().toLowerCase();

  if (!manager.commands?.length) {
    return undefined;
  }

  const sortedCommands = [...manager.commands].sort((a, b) => {
    const nameA = Array.isArray(a.name) ? a.name[0] : a.name;
    const nameB = Array.isArray(b.name) ? b.name[0] : b.name;
    return (nameB?.length || 0) - (nameA?.length || 0);
  });

  return sortedCommands.find((cmd) => {
    if (!isAdmin && offlineOnly && cmd.permission === "admin" && !cmd.offline) {
      return false;
    }

    const names = [
      ...(typeof cmd.name === "string" ? [cmd.name] : cmd.name || []),
      ...(cmd.aliases || [])
    ].map(n => n.toLowerCase());

    return names.some(alias => {
      let aliasToCheck = alias.startsWith('-') ? `${prefix}${alias.slice(1)}` : alias;

      if (/\(.*\)/.test(aliasToCheck)) {
        try {
          const regex = new RegExp("^" + aliasToCheck);
          return regex.test(lowerInput);
        } catch (err) {
          console.warn("Invalid regex alias:", aliasToCheck);
          return false;
        }
      }

      return (
        lowerInput === aliasToCheck ||
        lowerInput.startsWith(aliasToCheck + ' ')
      );
    });
  });
}


export const isFreeCommand = (name: string, manager: CM): boolean =>
  resolveCommand(name, manager)?.freeUse ?? false;









interface Props {
  cancel: (id: string) => void;
}

export type Prompt = (message: CommandMessage, parsedMessage: ParsedMessage, props: Props) => void;

type ActivePrompt = {
  callback: Prompt;
  timeout?: NodeJS.Timeout;
  version: number;
};

const promptStore = new Map<string, ActivePrompt>();
const promptVersion = new Map<string, number>();

export function createPrompt(
  id: string,
  callback: Prompt,
  timeout: number | null = 20000
) {
  const version = (promptVersion.get(id) ?? 0) + 1;
  promptVersion.set(id, version);

  const promptData: ActivePrompt = { callback, version };

  if (timeout !== null) {
    promptData.timeout = setTimeout(() => {
      if (promptVersion.get(id) === version) {
        promptStore.delete(id);
        promptVersion.delete(id);
      }
    }, timeout);
  }

  promptStore.set(id, promptData);
}


export function removePrompt(id: string) {
  const prompt = promptStore.get(id);
  if (prompt?.timeout) clearTimeout(prompt.timeout);
  promptStore.delete(id);
}

export function processPrompt(
  id: string,
  message: CommandMessage,
  parsedMessage: ParsedMessage
) {
  const prompt = promptStore.get(id);
  if (!prompt) return false;

  const versionBefore = prompt.version;

  prompt.callback(message, parsedMessage, {
    cancel: removePrompt
  });

  if (promptVersion.get(id) === versionBefore) {
    promptStore.delete(id);
    promptVersion.delete(id);
  }

  return true;
}

export function getPrompt(id: string): { prompt: Prompt; version: number } | null {
  const data = promptStore.get(id);
  const version = promptVersion.get(id);
  if (!data || version === undefined) return null;

  return {
    prompt: data.callback,
    version
  };
}

export function hasPrompt(id: string): boolean {
  return promptStore.has(id);
}

export function clearAllPrompt() {
  promptStore.clear(); 
  promptVersion.clear();
}





const configPath = path.resolve(__dirname, "../../../config.json");

const defaultConfig = {
    name: { en: "Void Overlord", vi: "Hư Không Đại Đế" },
    creator: "NPK31",
    prefix: "-",
    adminIDs: [] as string[],
    blacklist: { users: [] as string[], threads: [] as string[] },
    version: "1.0.0",
    running: "on",
};

export const readConfig = (): typeof defaultConfig => {
    try {
        if (!fs.existsSync(configPath)) {
            console.warn("⚠️ config.json không tồn tại. Dùng config mặc định.");
            return { ...defaultConfig };
        }

        const data = fs.readFileSync(configPath, "utf8");
        const config = JSON.parse(data);

        return {
            ...defaultConfig,
            ...config,
            blacklist: {
                users: Array.isArray(config.blacklist?.users) ? config.blacklist.users : [],
                threads: Array.isArray(config.blacklist?.threads) ? config.blacklist.threads : [],
            },
        };
    } catch (err) {
        console.warn("⚠️ Không đọc được config.json. Dùng config mặc định.");
        return { ...defaultConfig };
    }
};

const writeConfig = (config: any) => {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4), "utf8");
        console.log("✅ config.json Saved");
    } catch (err) {
        console.error("❌ Error while writing config.json:", err);
    }
};

export const getAdminList = (): string[] => readConfig().adminIDs;
export const isAdministrator = (id: string) => getAdminList().includes(id);
export const addAdministrator = (id: string) => {
    if (id === "admin") return false;
    const config = readConfig();
    if (config.adminIDs.includes(id)) return false;

    config.adminIDs.push(id);
    writeConfig(config);
    return true;
};
export const removeAdministrator = (id: string) => {
    const config = readConfig();
    const index = config.adminIDs.indexOf(id);
    if (index === -1) return false;

    config.adminIDs.splice(index, 1);
    writeConfig(config);
    return true;
};






export const getBlacklist = () => readConfig().blacklist;
export const isBlacklisted = (type: "users" | "threads", id: string) => getBlacklist()[type].includes(id);
export const addToBlacklist = (type: "users" | "threads", id: string) => {
    const config = readConfig();
    if (config.blacklist[type].includes(id)) return false;

    config.blacklist[type].push(id);
    writeConfig(config);
    return true;
};
export const removeFromBlacklist = (type: "users" | "threads", id: string) => {
    if (id === "test_blacklist") return false;
    const config = readConfig();
    const index = config.blacklist[type].indexOf(id);
    if (index === -1) return false;

    config.blacklist[type].splice(index, 1);
    writeConfig(config);
    return true;
};

export const isActive = (): boolean => readConfig().running === "on";

export const toggleBot = (enable: boolean): void => {
    const config = readConfig();
    const status = enable ? "on" : "off";

    if (config.running === status) {
        console.log(`🤖 | The bot is already ${status}. No need to toggle again!`);
        return;
    }

    config.running = status;
    writeConfig(config);
    
    console.log(enable ? "🚀 | The bot is awake and ready to roll!" : "💤 | The bot is going to sleep now. Don't wake me up!");
};

export function parseArgs(message: string): Record<string, string> {
  const result: Record<string, string> = {};
  const parts = message.split(' ').slice(1);

  let currentKey: string | null = null;
  let currentValue: string[] = [];

  for (const part of parts) {
      if (part.includes('=') && !part.endsWith('=')) {
          if (currentKey) {
              result[currentKey] = currentValue.join(' ').trim();
          }

          const [key, ...rest] = part.split('=');
          currentKey = key;
          currentValue = [rest.join('=')];
      } else {
          currentValue.push(part);
      }

      if (part.endsWith('=') && currentKey) {
          result[currentKey] = currentValue.join(' ').replace(/=$/, '').trim();
          currentKey = null;
          currentValue = [];
      }
  }

  if (currentKey) {
      result[currentKey] = currentValue.join(' ').trim();
  }

  return result;
}





const commandsTemp = path.resolve(__dirname, "../cache/tempCommands.json");

export const readInjectedCommands = (): string[] => {
    if (!fs.existsSync(commandsTemp)) {
        console.warn("⚠️ tempCommands.json does not exist. Creating default empty array.");
        fs.writeFileSync(commandsTemp, JSON.stringify([], null, 2), "utf8");
        return [];
    }

    try {
        const raw = fs.readFileSync(commandsTemp, "utf8");
        const data = JSON.parse(raw);

        if (!Array.isArray(data)) {
            console.warn("⚠️ JSON data is not an array. Resetting to empty array.");
            fs.writeFileSync(commandsTemp, JSON.stringify([], null, 2), "utf8");
            return [];
        }

        const isAllStrings = data.every((item) => typeof item === "string");
        if (!isAllStrings) {
            console.warn("⚠️ JSON array must contain only strings. Resetting to empty array.");
            fs.writeFileSync(commandsTemp, JSON.stringify([], null, 2), "utf8");
            return [];
        }

        return data;
    } catch (err) {
        console.warn(`⚠️ Error reading or parsing tempCommands.json: ${(err as Error).message}`);
        fs.writeFileSync(commandsTemp, JSON.stringify([], null, 2), "utf8");
        return [];
    }
};


export const getInjectedCommandsNameList = (): string[] | null => {
    const data = readInjectedCommands();
    if (!data) return null;

    try {
        return data.map((item) => path.basename(path.dirname(item)));
    } catch (err) {
        console.warn(`⚠️ Failed to extract command names: ${(err as Error).message}`);
        return null;
    }
};


export const addInjectCommand = (command: string): boolean => {
    try {
        const data = readInjectedCommands();

        if (!data) {
            console.warn("⚠️ Unable to read data from tempCommands.json.");
            return false;
        }

        if (data.includes(command)) {
            console.warn("⚠️ Command already exists in tempCommands.json.");
            return false;
        }

        data.push(command);

        fs.writeFileSync(commandsTemp, JSON.stringify(data, null, 2), "utf8");

        console.log("✅ Command added to tempCommands.json.");
        return true;

    } catch (err) {
        console.error("⚠️ Error writing data to tempCommands.json:", err);
        return false;
    }
};

export const removeInjectedCommand = (command: string): boolean => {
    try {
        const data = readInjectedCommands();

        if (!data) {
            console.warn("⚠️ Unable to read data from tempCommands.json.");
            return false;
        }

        const index = data.indexOf(command);
        if (index === -1) {
            console.warn("⚠️ Command not found in tempCommands.json.");
            return false;
        }

        data.splice(index, 1);

        fs.writeFileSync(commandsTemp, JSON.stringify(data, null, 2), "utf8");

        console.log("✅ Command removed from tempCommands.json.");
        return true;

    } catch (err) {
        console.error("⚠️ Error writing data to tempCommands.json:", err);
        return false;
    }
};







const ownerPath = path.resolve(__dirname, "../cache/owner.json");
type OwnerData = Record<string, string[]>;

const readRaw = (): OwnerData => {
  if (!fs.existsSync(ownerPath)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(ownerPath, "utf8");
    const data = JSON.parse(raw);

    if (typeof data !== "object" || Array.isArray(data)) {
      throw new Error("owner.json is not in the correct object format.");
    }

    return data;
  } catch (err) {
    console.warn("⚠️ Unable to read owner.json:", err);
    return {};
  }
};

export const isOwnerAllowed = (uid: string, commandName: string): boolean => {
  const data = readRaw(); 
  const config = readConfig();

  const prefix = config.prefix ?? defaultConfig.prefix; 

  const cleanedCommandName = commandName.startsWith(prefix) 
    ? commandName.slice(prefix.length) 
    : commandName;

  const permissions = data[uid]; 

  if (!permissions) return false; 
  if (permissions.includes("*")) return true; 

  return permissions.includes(cleanedCommandName);  
};

export const isAnyOwnerAllowed = (uid: string, commandNames: string[]): boolean => {
  try {
    const data = readRaw();
    const config = readConfig();
    const prefix = config.prefix ?? defaultConfig.prefix;

    const permissions = data[uid];
    
    if (!permissions) return false;

    if (permissions.includes("*")) return true;

    const cleanedCommandNames = commandNames.map(commandName =>
      commandName.startsWith(prefix) ? commandName.slice(prefix.length) : commandName
    );

    return cleanedCommandNames.some(command => permissions.includes(command));
  } catch (err) {
    console.error("❌ Error while checking owner permissions:", err);
    return false;
  }
};

export const addOwnerPermission = (uid: string, commandName: string): boolean => {
  try {
    const data = readRaw();
    if (!data[uid]) data[uid] = [];

    if (!data[uid].includes(commandName)) {
      data[uid].push(commandName);
      fs.writeFileSync(ownerPath, JSON.stringify(data, null, 2), "utf8");
      console.log("✅ Permission granted to owner for the command.");
    }

    return true;
  } catch (err) {
    console.error("❌ Error while adding owner permission:", err);
    return false;
  }
};

export const removeOwnerPermission = (uid: string, commandName: string): boolean => {
  try {
    const data = readRaw();
    if (!data[uid]) return false;

    data[uid] = data[uid].filter(cmd => cmd !== commandName);

    if (data[uid].length === 0) {
      delete data[uid];
    }

    fs.writeFileSync(ownerPath, JSON.stringify(data, null, 2), "utf8");
    console.log("✅ Command permission removed from owner.");
    return true;
  } catch (err) {
    console.error("❌ Error while removing owner permission:", err);
    return false;
  }
};

export const getOwnerPermissions = (uid: string): string[] | null => {
  const data = readRaw();
  return data[uid] || null;
};











const disabledCommandsPath = path.resolve(__dirname, "../cache/commandsDisabled.json");

export const readDisabledCommands = (): string[] => {
    if (!fs.existsSync(disabledCommandsPath)) {
      return [];
    }
  
    try {
      const raw = fs.readFileSync(disabledCommandsPath, "utf8");
      const data = JSON.parse(raw);
  
      if (!Array.isArray(data)) {
        console.warn("⚠️ Data in commandsDisabled.json is invalid.");
        return [];
      }
  
      return data;
    } catch (err) {
      console.error("⚠️ Failed to read or parse commandsDisabled.json:", err);
      return [];
    }
};


export const toggleCommand = (commandName: string, action: "disable" | "enable"): boolean => {
    try {
      const data = readDisabledCommands();
      let result = false;
  
      if (action === "disable") {
        if (data.includes(commandName)) return true; 
  
        data.push(commandName);
        result = true;
        console.log(`✅ Command ${commandName} disabled.`);
      } else if (action === "enable") {
        const index = data.indexOf(commandName);
        if (index === -1) return true; 
  
        data.splice(index, 1);
        result = true;
        console.log(`✅ Command ${commandName} enabled.`);
      }
  
      fs.writeFileSync(disabledCommandsPath, JSON.stringify(data, null, 2), "utf8");
      return result;
    } catch (err) {
      console.error("❌ Error toggling command:", err);
      return false;
    }
};
  


export const isCommandDisabled = (commandName: string): boolean => {
    const data = readDisabledCommands();
    return data.includes(commandName);
};




const inventoryPath = path.resolve(__dirname, "../cache/inventory.json");

export type Inventory = Record<string, string[]>;

export const readInventory = (): Inventory => {
  if (!fs.existsSync(inventoryPath)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(inventoryPath, "utf8");
    const data = JSON.parse(raw);

    if (typeof data !== "object" || Array.isArray(data)) {
      throw new Error("inventory.json is not in the correct object format.");
    }

    return data;
  } catch (err) {
    console.warn("⚠️ Unable to read inventory.json:", err);
    return {};
  }
};

export const getInventoryById = (userID: string): string[] => {
  const inventory = readInventory();

  return inventory[userID] ?? [];
};

export const hasItemInInventory = (userId: string, itemName: string, amount: number): boolean => {
  const userData = readInventory();

  if (!userData[userId]) {
    return false;
  }

  const itemCount = userData[userId].filter(item => item === itemName).length;
  return itemCount >= amount;
};

const updateUserInventory = (data: Inventory) => {
  try {
    fs.writeFileSync(inventoryPath, JSON.stringify(data, null, 2), { encoding: "utf-8" });
  } catch (error) {
    console.error("Error writing inventory data:", error);
  }
};

export const itemInventoryManager = (userID: string, action: 'add' | 'remove', itemName: string): string => {
  const inventory = readInventory();

  if (!inventory[userID]) {
    inventory[userID] = [];
  }

  switch (action) {
    case 'add':
      if (inventory[userID].includes(itemName)) {
        return `Item ${itemName} đã có trong kho của bạn.`;
      }
      inventory[userID].push(itemName);
      updateUserInventory(inventory);
      return `Đã thêm ${itemName} vào kho của bạn.`;

    case 'remove':
      const itemIndex = inventory[userID].indexOf(itemName);
      if (itemIndex === -1) {
        return `Không tìm thấy item ${itemName} trong kho.`;
      }
      inventory[userID].splice(itemIndex, 1);
      updateUserInventory(inventory);
      return `Đã xóa ${itemName} khỏi kho của bạn.`;

    default:
      return 'Lệnh không hợp lệ.';
  }
};


export const addItemToInventory = (userID: string, itemName: string): string => {
  const inventory = readInventory();

  if (!inventory[userID]) {
    inventory[userID] = [];
  }

  if (inventory[userID].includes(itemName)) {
    return `Item ${itemName} đã có trong kho của bạn.`;
  }

  inventory[userID].push(itemName);
  updateUserInventory(inventory);
  return `Đã thêm ${itemName} vào kho của bạn.`;
};

export const removeItemFromInventory = (userID: string, itemName: string): string => {
  const inventory = readInventory();

  if (!inventory[userID]) {
    inventory[userID] = [];
  }

  const itemIndex = inventory[userID].indexOf(itemName);
  if (itemIndex === -1) {
    return `Không tìm thấy item ${itemName} trong kho.`;
  }

  inventory[userID].splice(itemIndex, 1);
  updateUserInventory(inventory);
  return `Đã xóa ${itemName} khỏi kho của bạn.`;
};


export const userDataCache: Record<string, any> = {};


