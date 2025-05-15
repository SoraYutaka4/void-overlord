import { API, Message as Event, CM } from "../types";
import { resolveCommand } from "../utils";
import { reloadModule } from "../utils/cache";
import { utils } from "../types/utilsType";
import chalk from "chalk";

export default async (
    api: API,
    message: Exclude<Event, { type: "message" }>,
    manager: CM,
    offline: boolean
) => {
    async function handleEvent(commandName: string) {
        try {
            const command = resolveCommand(commandName, manager, offline);
            if (!command) {
                console.warn(`⚠️ Event '${commandName}' not found.`);
                return;
            }

            const commandModule = await reloadModule(command.path);
            if (!commandModule?.default?.execute) {
                console.warn(`⚠️ Module '${command.path}' does not have an execute function.`);
                return;
            }

            const botGlobal = (globalThis as any).mybot;

            const Args = {
                api,
                message,
                manager,
                global: botGlobal,
                botInfo: botGlobal.botInfo?.data || null,
                ...utils,
            };

            await commandModule.default.execute(Args);
        } catch (err) {
            console.error(chalk.red(`💥 Boom! Lỗi ở event '${commandName}':`), err);
        }
    }

    const type = message.type;

    const eventMap = {
        "log:subscribe": { name: "event:subscribe", emoji: "🎉" },
        "log:unsubscribe": { name: "event:unsubscribe", emoji: "👋" },
        "log:thread-name": { name: "event:threadname", emoji: "✏️" },
        "log:thread-image": { name: "event:threadimage", emoji: "🖼️" },
        "log:thread-color": { name: "event:threadcolor", emoji: "🎨" },
        "log:thread-icon": { name: "event:threadicon", emoji: "💠" },
        "log:admin-add": { name: "event:adminadd", emoji: "🛡️" },
        "log:admin-remove": { name: "event:adminremove", emoji: "⚔️" },
    };
    
    if (type === "event") {
        console.log(message);
        const eventInfo = eventMap[message.logMessageType as keyof typeof eventMap];
        if (eventInfo) {
            await handleEvent(eventInfo.name);
            console.log(chalk.blueBright(`${eventInfo.emoji} New Event: ${eventInfo.name.replace("event:", "")}`));
        }
    }
};
