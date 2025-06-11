import { handleMessage, initializeBot, handleEvent } from "./core/handler";
import { CooldownManager } from "./controllers/cooldownManager";
import { setDefaultCooldown } from "./controllers/commandManager";
import { UserManager } from "./controllers/usersManager";
import { watchFlagFile } from "./utils/cache";
import { API, CM, Config, CommandMessage as Message, Message as Event } from "./types";
import hologram from "./core/hologram";
import BotNinja from "./utils/messageTransformer";
import path from "path";
import fs from "fs";
import cors from "cors";
import express, { Request, Response } from "express";

export * from "./types";
export * from "./utils";

const cooldownManager = new CooldownManager();

const cachePath = path.resolve(__dirname, "cache");
const publicPath = path.resolve(__dirname, "..", "public");
const distPath = path.join(publicPath, "dist");

if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });
if (!fs.existsSync(distPath)) fs.mkdirSync(distPath, { recursive: true });


const filePath = path.join(cachePath, "cooldowns.json");
cooldownManager.loadFromFile(filePath);
cooldownManager.startAutoSave(filePath);

const emojiList = [
    "😎", "😂", "🥶", "🗿","😐", "😑", "🙃", 
    "🤨", "😶", "👀", "🤫", "👌", "😳"
]

const defaultConfig: Config = {
    obfuscateText: false,
    delay: { 
        send: {min: 1000, max: 3000},
        typing: { min: 1000, max: 2000 }
    },
    cache: {
        log: {
            debug: ["all"],
            info: true,
            error: true
        }
    },
    typingIndicator: false,
    emojiDrop: {
        enabled: false,
        chance: 0.15,
        emojis: emojiList,
        delay: {
            min: 1250,
            max: 3000
        }
    },
    df_cooldown: 5000
};


const localCommandManager: CM = {
    commandCount: 0,
    messageCount: 0,
    commands: [],
    cooldowns: cooldownManager,
    users: UserManager,
    publicPath: path.resolve(__dirname, "..", "public"),
    config: defaultConfig,
    interactionsCount: new Map<string,number>(),
    groupInteractionsCount: new Map<string, number>()
};

type Options = {
    DataRelay: (callback: (api: API, message: Event | Message) => void) => void;
    config?: Config
};

(globalThis as any).mybot = {
    message: "This is global variable"
};

process.on("uncaughtException", (err) => {
    console.error("🔥 Uncaught Exception:", err);
  });
  
process.on("unhandledRejection", (reason, promise) => {
    console.error("🔥 Unhandled Rejection:", reason);
});

// setInterval(() => {
//   const mem = process.memoryUsage();
//   console.log(`[${new Date().toISOString()}] HeapUsed: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
// }, 60000); 


/**
 * Deploys the bot's command center, initializing core systems and handling incoming messages.
 * 
 * This function sets up the bot's environment, including:
 * - Loading configurations
 * - Managing cooldowns
 * - Setting up a middleware relay for message processing
 * - Watching for system updates and automatically reloading the bot
 * 
 * ---
 * 
 * 🛠 **How It Works:**
 * - Initializes the bot with default or user-defined settings.
 * - Watches for a `rscache.flag` file to trigger automatic bot reloading.
 * - Uses a middleware function (`DataRelay`) to process incoming messages dynamically.
 * - Supports **message obfuscation** and **dynamic delay configuration**.
 * 
 * ---
 * 
 * @param {Options} options - Configuration object containing the middleware relay function
 *                            and additional settings for message processing.
 * 
 * @param {(callback: (api: API, message: Message) => void) => void} options.DataRelay -  
 *        A middleware function responsible for relaying messages between the bot's API 
 *        and its command handler.
 *        - **Type:** Function that takes the `api` object and `message` object as parameters.
 *        - **Example:** `(handler) => api.listenMqtt(handler)`
 * 
 * @param {Config} [options.config={}] - Additional configuration for message processing.
 *        - **Type:** Optional `Config` object containing settings for delays, obfuscation, and logging.
 * 
 * @param {boolean} [options.config.obfuscateText=false] -  
 *        If `true`, obfuscates message text before sending to prevent detection.
 *        - **Type:** Boolean
 *        - **Default:** `false`
 * 
 * @param {{ min?: number; max?: number; }} [options.config.delay] -  
 *        Configurable delay for message sending to simulate human-like behavior.
 *        - **Type:** Object with optional `min` and `max` properties.
 * 
 * @param {number} [options.config.delay.min=1000] -  
 *        Minimum delay (in milliseconds) before sending a message.
 *        ⚠️ **Warning:** Ensure `delay.min` ≤ `delay.max` to avoid unexpected behavior.
 *        - **Type:** Integer (milliseconds)
 *        - **Default:** `1000`
 * 
 * @param {number} [options.config.delay.max=3000] -  
 *        Maximum delay (in milliseconds) before sending a message.
 *        - **Type:** Integer (milliseconds)
 *        - **Default:** `3000`
 * 
 * @param {CacheConfigType} [options.config.cache={}] - Configuration options for logging.
 *        - **Type:** Object containing logging configurations for debugging and error handling.
 * 
 * @param {("resolvePath" | "cacheClear" | "importUrl" | "all")[]} [options.config.cache.log.debug] -  
 *        Specify which debug logs should be enabled.  
 *        - **Type:** Array of strings (log categories)
 *        - **Possible values:**
 *          - `"resolvePath"` → Logs when the file path is resolved.  
 *            _Example output:_ `📂 File Path Resolved: /path/to/module.ts`  
 *          - `"cacheClear"` → Logs when clearing the module cache (CommonJS).  
 *            _Example output:_ `🧹 Clearing cache for: /path/to/module.ts`  
 *          - `"importUrl"` → Logs the generated import URL for ES Module reloading.  
 *            _Example output:_ `🌍 Importing module from URL: file:///path/to/module.ts?update=1712000000000`  
 *          - `"all"` → Enables all debug logs.
 *        - **Default:** `["all"]`
 * 
 * @param {boolean} [options.config.cache.log.info=true] -  
 *        Enable general information logs.  
 *        - **Type:** Boolean
 *        - **Default:** `true`
 *        - **Example output:** `ℹ️ Bot initialized successfully!`
 * 
 * @param {boolean} [options.config.typingIndicator=false]  
 *        Enables or disables the typing indicator for the bot.
 *        - **Type:** Boolean  
 *        - **Default:** `false`  
 *        - **Example:** `false` means no typing indicator, `true` means the bot will show a typing status.
 *
 * @param {object} [options.config.emojiDrop] -
 *       Configuration for emoji drop feature.
 * *
 * @param {boolean} [options.config.emojiDrop.enabled=false] -
 *       Enables or disables the emoji drop feature.
 * *       - **Type:** Boolean
 * *       - **Default:** `false`
 * *       - **Example:** `false` means no emoji drop, `true` means the bot will drop emojis in messages.
 * * @param {number} [options.config.emojiDrop.chance=0.15] -
 *       Probability of dropping an emoji in a message.
 * *       - **Type:** Number (0 to 1)
 * *       - **Default:** `0.15` (15% chance)
 * *       - **Example:** `0.15` means there's a 15% chance of dropping an emoji in a message.
 * * @param {string[]} [options.config.emojiDrop.emojis] -
 *       List of emojis to choose from for dropping.
 * *       - **Type:** Array of strings (emojis)
 * *       - **Default:** `["😎", "😂", "🥶", "🗿","😐", "😑", "🙃", "🤨", "😶", "👀", "🤫", "👌", "😳"]`
 * *       - **Example:** `["😎", "😂", "🥶"]` means the bot can drop any of these emojis in messag
 *  * * @param {object} [options.config.emojiDrop.delay] -
 *       Configuration for the delay between emoji drops.
 * *       - **Type:** Object containing `min` and `max` properties for delay.
 * * @param {number} [options.config.emojiDrop.delay.min=1250] -
 *       Minimum delay (in milliseconds) between emoji drops.
 * *       - **Type:** Integer (milliseconds)
 * *       - **Default:** `1250` (1.25 seconds)
 * *       - **Example:** `1250` means the bot will wait at least 1.25 seconds before dropping another emoji.
 * * @param {number} [options.config.emojiDrop.delay.max=3000] -
 *       Maximum delay (in milliseconds) between emoji drops.
 * *       - **Type:** Integer (milliseconds)
 * *       - **Default:** `3000` (3 seconds)
 * *       - **Example:** `3000` means the bot will wait at most 3 seconds before dropping another emoji.
 * 
 * * @param {number} [poptions.config.df_cooldown=5000]
 * *       Default cooldown for commands in milliseconds.
 * *       - **Type:** Integer (milliseconds)
 * *       - **Default:** `5000` (5 seconds)
 * *       - **Example:** `5000` means the bot will wait 5 seconds before allowing the same command to be executed again.
 * 
 * * ---
 * 
 * 📝 **Example Usage:**
 * ```ts
 * await VoidSortie({
 *-----DataRelay: (handler) => api.listenMqtt(handler),
 *-----config: {
 *---------obfuscateText: false,
 *---------delay: { min: 1000, max: 3000 },
 *---------cache: { log: { debug: ["resolvePath", "cacheClear"] } }
 *----}
 * });
 * ```
 * _This initializes the bot and listens for messages via the MQTT protocol._
 */
export async function VoidSortie(options: Options) {
    hologram();
    await initializeBot(localCommandManager);
    
    watchFlagFile(path.resolve(__dirname, "scripts", "rscache.flag"), async () => {
        console.clear();
        console.log("🔄 Mission Update: Bot is rebooting!");  
        await initializeBot(localCommandManager);  
    });
    
    setDefaultCooldown(options.config?.df_cooldown ?? defaultConfig.df_cooldown ?? 3000);

    const config: Config = {
        obfuscateText: typeof options.config?.obfuscateText === "boolean" 
            ? options.config.obfuscateText
            : defaultConfig.obfuscateText,
    
        delay: {
            send: {
                min: (
                    options.config?.delay?.send?.min ?? 
                    defaultConfig.delay?.send?.min 
                ),
                max: (
                    options.config?.delay?.send?.max ??
                    defaultConfig.delay?.send?.max 
                )
            },
            typing: {
                min: (
                    options.config?.delay?.typing?.min ??
                    defaultConfig.delay?.typing?.min 
                ),
                max: (
                    options.config?.delay?.typing?.max ??
                    defaultConfig.delay?.typing?.max 
                )
            }
        },
    
        typingIndicator: typeof options.config?.typingIndicator === "boolean"
            ? options.config.typingIndicator
            : defaultConfig.typingIndicator,
    
        cache: {
            log: {
                debug: Array.isArray(options.config?.cache.log?.debug) 
                    ? options.config.cache.log.debug 
                    : ["cacheClear"],
    
                info: Array.isArray(options.config?.cache.log?.info) 
                    ? options.config.cache.log.info 
                    : ["loaded"],
    
                error: typeof options.config?.cache.log?.error === "boolean" 
                    ? options.config.cache.log.error
                    : defaultConfig.cache.log?.error ?? true
            }
        },

        emojiDrop: {
            enabled: typeof options.config?.emojiDrop?.enabled === "boolean" 
                ? options.config.emojiDrop.enabled 
                : defaultConfig.emojiDrop?.enabled ?? false,
    
            chance: typeof options.config?.emojiDrop?.chance === "number" 
                ? options.config.emojiDrop.chance 
                : defaultConfig.emojiDrop?.chance ?? 0.15 ,
    
            emojis: Array.isArray(options.config?.emojiDrop?.emojis) 
                ? options.config.emojiDrop.emojis 
                : defaultConfig.emojiDrop?.emojis ?? emojiList,
    
            delay: {
                min: typeof options.config?.emojiDrop?.delay?.min === "number" 
                    ? options.config.emojiDrop.delay.min 
                    : defaultConfig.emojiDrop?.delay?.min ?? 1250,
    
                max: typeof options.config?.emojiDrop?.delay?.max === "number" 
                    ? options.config.emojiDrop.delay.max 
                    : defaultConfig.emojiDrop?.delay?.max ?? 3000
            }
        },
        df_cooldown: typeof options.config?.df_cooldown === "number" 
            ? options.config.df_cooldown 
            : defaultConfig.df_cooldown
    };
    
    localCommandManager.config = config;
    
    let localAPI: API | null = null;
    const app = express();
    
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.post("/send", async (req: Request, res: Response) => {
        const { message, threadID } = req.body;
        if (!localAPI) {
            console.error("Error: localAPI not initialized");
            return res.status(400).json({ error: "Not found API" });
        }
    
        try {
            await localAPI.sendMessage(message, threadID, (err, msg) => {
                if (err) return console.error(err);
                console.log("send Message result:", msg); 
                if (!msg) {
                    console.warn("Warning: sendMessage returned undefined or null");
                    return res.status(500).json({ error: "sendMessage returned invalid data" });
                }
                return res.json(msg);
            });
        } catch (error) {
            console.error("Error sending message:", error);
            return res.status(500).json({ error: "Failed to send message" });
        }
    });

    app.post("/unsend", async (req: Request, res: Response) => {
        const { messageID } = req.body;
    
        if (!localAPI) {
            return res.status(400).json({ error: "Not found API" });
        }

        try {
            const result = await localAPI.unsendMessage(messageID);
            return res.json(result); 
        } catch (error) {
            console.error("❌ Lỗi khi hủy tin nhắn:", error);
    
            return res.status(500).json({ error: "Failed to unsend message" });
        }
    });

    
    
    

    options.DataRelay(async (api, message) => {
        if (!localAPI) localAPI = api;
        const tacticalAPI = BotNinja(api, config);

        if (
             message.type === "typ" || message.type === "read" || message.type === "read_receipt" ||
             message.type === "message_reaction" || message.type === "message_unsend" 
        ) return;
        if ( message.type === "event" || message.type !== "message" ){
            await handleEvent(api, message, localCommandManager);
        }

        await handleMessage(tacticalAPI, message as Message, localCommandManager, {emojiDrop: config.emojiDrop}); 
        
    });
    
    app.listen(4044);
    

}
