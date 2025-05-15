import { API, botProcesstorConfig, CommandMessage as Message, Message as Event } from "../types";
import { getBotModule, loadBotModule } from "./loader";
import { CM } from "../types";
import { reloadModule } from "../utils/cache";
import path from "path";
import chalk from "chalk";

export const handleMessage = async (api: API, message: Message, manager: CM, config: botProcesstorConfig) => {
    const botModule = getBotModule();
    if (!botModule) {
        console.error(chalk.red("❌ botModule is null, skipping message!"));
        return;
    }

    try {
        botModule( 
            api,
            {
                type: message ? "message_reply" : "message", 
                message,

            },
            manager,
            config,
        );
    } catch (error) {
        console.error(chalk.red("❌ Error in botModule:", error));
    }
};

export const handleEvent = async (api: API, message: Exclude<Event, { type: "message" }>, manager: CM) => {
    try {
        const handler = await reloadModule(
            path.resolve(__dirname, "..", "controllers/eventHandlers.ts"),
            { log: { debug: false, info: false } }
        );

        if (!handler || !handler.default) {
            console.warn(chalk.yellow("⚠️ Event handler module missing or has no default export"));
            return;
        }

        handler.default(
            api,
            message,
            manager
        );
    } catch (error) {
        console.error(chalk.red("💥 Boom! Có lỗi nè:"), error);
    }
};

export const initializeCommandManager = async (manager: CM) => {
    try {
        manager.commandCount = 0;
        manager.commands = [];

        (await reloadModule(path.resolve(__dirname, "..", "controllers", "commandManager.ts"), {
            log: {
                info: ["loaded"]
            }
        })).default(manager);
        console.log(chalk.greenBright("✅ Manager Initialized / Updated!"));
    } catch (error) {
        console.error(chalk.red("❌ Error initializing commandManager:", error instanceof Error ? error.message : error));
    }
};

export const initializeBot = async (manager: CM) => {
    await loadBotModule({
        cache: {
            log: {
                debug: false,
                info: ["loaded"]
            }
        }
    });
    await initializeCommandManager(manager);
}