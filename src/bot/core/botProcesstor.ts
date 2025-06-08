import { API, Event, CM, CommandMessage as Message, botProcesstorConfig as Config } from "../types";
import { 
    isMessageEvent, isActive, parseArgs, shouldDropEmoji, resolveCommand,
    removeDiacritics as RD, getMatchedCommand, hasPrompt, isFreeCommand, 
} from "../utils";
import { isSpam} from "../controllers/cooldownService";
import { reloadModule } from "../utils/cache";
import path from "path";
import { isUserError } from "../controllers/usersManager";
import { applyDelay } from "../utils/messageTransformer";

export default async (api: API, event: Event, manager: CM, config: Config) => {
    try {
        const message: Message = event.message;
        if (!isMessageEvent(event)) return;
        
        const botID = api.getCurrentUserID();
        if (message.senderID === botID) return;

        const uid = `${message.senderID}:${message.threadID}`;

        manager.groupInteractionsCount.set(uid, (manager.groupInteractionsCount.get(uid) ?? 0) + 1);
        await handleEmojiDrop(config, message.threadID, api);
        
        const body = (message.body ?? "").trim();
        const args = body.split(/\s+/g);

        const commandTriggers = getCommandTriggers();
        const normalizedBody = RD(body);
        const matchedCommand = getMatchedCommand(normalizedBody, commandTriggers);

        if (matchedCommand === "usebot") {
            await executeUseBotCommand(api, message, manager, { body, args });
            return;
        }

        type UserFilted = {
            name: string;
            firstName: string;
            balance: bigint;
            exp: number;
            level: number;
            [key: string]: any;
        };
        
        const user = await manager.users.getUserByID(message.senderID, true, false);

        if (
            (isUserError(user) && !(isFreeCommand(body.toLowerCase(), manager) || hasPrompt(message.senderID) ))
            || (resolveCommand(body.toLowerCase(), manager) && await checkSpam(message, api))
            || manager.cooldowns.isOnCooldown(message.senderID, "global").onCooldown 
            && !hasPrompt(message.senderID)
        ) return;


        const userFilted: UserFilted = !isUserError(user) ? user : {
            balance: 0n,
            level: 0,
            exp: 0,
            name: "",
            firstName: "",
        };

        const commandHandler = await reloadModule(
            path.resolve(__dirname, "..", "controllers", "commandHandler.ts"), 
            { log: { debug: false, info: false } }
        );
        const userInfo = { balance: userFilted.balance, level: userFilted.level, exp: userFilted.exp, uname: userFilted.name, fname: userFilted.firstName };

        await commandHandler.default(api, message, manager, { body, args, query: parseArgs(body) }, userInfo, !isActive());
    } catch (error) {
        console.error("❌ General error:", error);
    }
};

const handleEmojiDrop = async (config: Config, threadID: string, api: API) => {
    const drop = config.emojiDrop;
    if (shouldDropEmoji(drop) && drop.delay && drop.emojis) {
        await applyDelay(drop.delay.min, drop.delay.max);
        api.sendMessage(drop.emojis[Math.floor(Math.random() * drop.emojis.length)], threadID);
    }
};

const getCommandTriggers = () => ({
    usebot: ["su dung bot", "use bot", "tham gia bot", "dang ky bot", "kich hoat bot", "dang ki bot", "register bot", "sign up bot"]
});

const executeUseBotCommand = async (api: API, message: Message, manager: CM, { body, args }: { body: string, args: string[] }) => {
    try {
        console.log("📢 User requested bot usage guide.");
        const modulePath = path.resolve(__dirname, "..", "commands", "usebot.ts");
        const usebotCommand = await reloadModule(modulePath);
        await usebotCommand.default.execute({api, message, manager, parsedMessage: { body, args, query: {} }});
    } catch (error) {
        console.error("❌ Error executing 'usebot' command:", error);
    }
};

const checkSpam = async (message: Message, api: API) => {
    const spamCheck = isSpam(message.senderID, api, message);
    return spamCheck && typeof spamCheck === "object";
};