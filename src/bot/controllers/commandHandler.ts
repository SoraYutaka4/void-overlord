import { API, Message as Event, CM, ParsedMessage } from "../types";
import { isBlacklisted, isAdministrator, isAnyOwnerAllowed, processPrompt, getPrefix, resolveCommand } from "../utils/command";
import { isCoolingDown } from "./cooldownService";
import { reloadModule } from "../utils/cache";
import { utils } from "../types/utilsType";
import chalk from "chalk";
import fs from "fs";

  
export default async (
    api: API,
    message: Event,
    manager: CM,
    parsedMessage: ParsedMessage,
    { balance, level, exp, uname, fname }:
     { balance: number | bigint; level: number; exp: number, uname: string, fname: string },
    offline: boolean
) => {
    if (
        message.type !== "message" ||
        (isBlacklisted("threads", message.threadID) && !isAdministrator(message.senderID))
    ) return;
    
    const padding = "\u00A0".repeat(5);
    console.log(chalk.blueBright("💬 New Message:") + "\n\n" +
        padding + chalk.bold("SenderID: ") + chalk.green(message.senderID) + "\n" +
        padding + chalk.bold("Body: ") + chalk.yellow(parsedMessage.body) + "\n"
    );

    
    if (parsedMessage.args.length === 0) return;
    if (isBlacklisted("users", message.senderID)) return;

    const isAdmin = isAdministrator(message.senderID);
    
    const body = parsedMessage.args.join(" ").trim().toLowerCase();
    const command = resolveCommand(body, manager, offline, isAdmin);

    const increaseInteraction = (uid: string) =>
        manager.interactionsCount.set(
            `${uid}:${message.threadID}`, 
            (manager.interactionsCount.get(`${uid}:${message.threadID}`) ?? 0) + 1
        );

    const botGlobal = (globalThis as any).mybot;
    const prefix = getPrefix();

    if (!command || 
        !fs.existsSync(command.path) || 
        (command.prefix !== false && !parsedMessage.body.startsWith(prefix)) ||
        command.disabled
    ) {
        
        const isPromptProcessed = processPrompt(message.senderID, message, parsedMessage) || 
                                processPrompt(`event:all:${message.threadID}`, message, parsedMessage);
        if (isPromptProcessed) {
            increaseInteraction(uname);
        }
        
        return;
    }

    const prefixRegex = new RegExp(`^${getPrefix().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`, "i");
    const cleanBody = body.replace(prefixRegex, "").trim();
    
    const commandNames = Array.isArray(command.name) 
      ? [...command.name, ...(command.aliases ?? [])] 
      : [command.name, ...(command.aliases ?? [])];
    
    const matchedName = commandNames.find(name => cleanBody.startsWith(name))
      || (parsedMessage.args[0] ?? "").replace(prefixRegex, "").trim();    
    

    const isThreadDisabled = (Array.isArray(command.name) ? command.name : [command.name]).some((name) => {
        const threadDisabled = botGlobal.commandDisabled?.[message.threadID];
        return Array.isArray(threadDisabled) && threadDisabled.includes(name);
    });

    if (isThreadDisabled) return;
    
    if (command.permission === "admin" && !isAdministrator(message.senderID)) return;
    
    if (command.permission === "owner" && !isAdministrator(message.senderID)) {
        const aliases = Array.isArray(command.aliases) && command.aliases.length > 0 ? command.aliases : [];
        const commandNames = Array.isArray(command.name) ? command.name : [command.name];
        
        const isAllowed = isAnyOwnerAllowed(message.senderID, [...commandNames, ...aliases]);
        if (!isAllowed) {
            console.log(chalk.yellowBright("The sender does not have permission to access this command."));
            return;
        }
    }

    const cooldowns = manager.cooldowns;
    const cooldownKey = "global";

    const arg = parsedMessage.args[1];
    const usageAliases = ["usage", "huongdan", "use", "help"];
    const exampleAliases = ["example", "ex", "vd", "vidu"];
    const descriptionAliases = ["description", "mota", "thongtin", "gioithieu", "des"];
    const aliasAliases = ["alias", "aliasname", "tenkhac", "lenhkhac", "aliases"];

    const checkCooldown = (cooldownKey: string) => {
        if (isCoolingDown(cooldowns, message.senderID, cooldownKey, 2500)) return true;
        return false;
    }

    if (descriptionAliases.includes(arg)) {
        if (checkCooldown(cooldownKey)) return;

        const descriptionMessage = command.description || "❌ Lệnh này chưa có mô tả.";
        return api.sendMessage(`📝 *Mô tả:*\n⭢  ${descriptionMessage}`, message.threadID);
    }

    if (aliasAliases.includes(arg)) {
        if (checkCooldown(cooldownKey)) return;

        const aliasMessage = Array.isArray(command.aliases) && command.aliases.length > 0 
            ? `🔑 *Tên khác:*\n${command.aliases.join("\n")}` 
            : "❌ Lệnh này chưa có tên khác.";
        
        return api.sendMessage(aliasMessage, message.threadID);
    }

    if (usageAliases.includes(arg)) {
        if (checkCooldown(cooldownKey)) return;

        const usageMessage = Array.isArray(command.usage) 
            ? `📌 *Hướng dẫn:*\n${command.usage.join("\n")}` 
            : command.usage
            ? `📌 *Hướng dẫn:*\n${command.usage}`
            : "❌ Lệnh này chưa có hướng dẫn.";
        
        return api.sendMessage(usageMessage, message.threadID);
    }

    if (exampleAliases.includes(arg)) {
        if (checkCooldown(cooldownKey)) return;

        const exampleMessage = Array.isArray(command.example) 
            ? `🧩 *Ví dụ:*\n${command.example.join("\n")}` 
            : command.example
            ? `🧩 *Ví dụ:*\n${command.example}`
            : "❌ Lệnh này chưa có ví dụ.";
        
        return api.sendMessage(exampleMessage, message.threadID);
    }

    const failMessage = {
        balance: [
            "💸 Bạn cần ${required}, mà chỉ có ${current}.\n\n📌 **Cách kiếm tiền:**\n🎲 Dùng -taixiu hoặc -baucua để kiếm thêm!",
            "❌ Thiếu tiền! Cần ${required}, có ${current}.\n\n💡 Gợi ý: Thử vận may với -taixiu hoặc -baucua nha!",
            "📉 Còn thiếu ${missing} để xài lệnh.\n\n📌 **Mẹo:** Chơi game như -taixiu và -baucua để hốt bạc liền tay!"
        ],
        level: [
            "🚀 Cần level ${required}, bạn đang level ${current}.\n\n📌 **Hướng dẫn:**\n🔹 Dùng lệnh `-level` để xem level\n🔹 Dùng lệnh `-nhiemvu` để làm nhiệm vụ!",
            "❌ Level cần: ${required}, bạn có: ${current}.\n\n📌 **Hướng dẫn:**\n🔸 Gõ `-level` để kiểm tra level\n🔸 Gõ `-nhiemvu` để nhận nhiệm vụ!",
            "😢 Lên level ${required} rồi quay lại.\n\n📌 **Mẹo nè:**\n✨ Sử dụng `-level` để xem level hiện tại\n✨ Dùng `-nhiemvu` để cày nhiệm vụ lên level!"
        ],
        exp: [
            "📚 Cần ${required} EXP, bạn mới có ${current}.\n\n📌 **Hướng dẫn:**\n⚔️ Dùng lệnh -pvp để kiếm EXP nhanh!",
            "❌ EXP thiếu ${missing} nữa cơ.\n\n📌 **Gợi ý:** Dùng -pvp để đánh nhau kiếm EXP nhé!",
            "🔥 EXP yêu cầu: ${required} | Bạn có: ${current}.\n\n📌 **Tip:** Thử -pvp để cày EXP liền tay!"
        ]        
    };


    const formatNumber = (num: number | bigint, type: "balance" | "level" | "exp") => {
        const formatted = Number(num).toLocaleString("en-US");
        return type === "balance" ? `$${formatted}` : formatted;
    };

    const checkRequirement = (current: number | bigint, required: number | bigint, type: "balance" | "level" | "exp") => {
        if (typeof current === "bigint" ? current < BigInt(required) : Number(current) < Number(required)) {
            const missing = Number(required) - Number(current);
            const template = failMessage[type][Math.floor(Math.random() * failMessage[type].length)];
            const msg = template
                .replace("${required}", formatNumber(required, type))
                .replace("${current}", formatNumber(current, type))
                .replace("${missing}", formatNumber(missing, type));

            api.sendMessage(msg, message.threadID);
            console.log(chalk.red(`❌ ${type} requirement failed. Required: ${required}, Current: ${current}`));
            return false;
        }
        return true;
    };

    const { balance: requiredBalance = 0, level: requiredLevel = 0, exp: requiredExp = 0 } = command.rules;

    if (balance > 0 && !checkRequirement(balance, requiredBalance, "balance")) return;
    if (!checkRequirement(level, requiredLevel, "level")) return;
    if (!checkRequirement(exp, requiredExp, "exp")) return;

    if (!command.customCooldown) {
        if (isCoolingDown(cooldowns, message.senderID, cooldownKey, command.cooldown)) return;
    }

    try {
        const commandModule = await reloadModule(command.path);
        if (!commandModule?.default?.execute) return;

        manager.messageCount++;
        increaseInteraction(uname);

        console.log(chalk.blueBright(`✅ Executing command: ${body}`));

        const updatedParsedMessage = { ...parsedMessage, commandName: matchedName };

        const botGlobal = (globalThis as any).mybot;
        const botId = api.getCurrentUserID();

        const Args = {
            api,
            message,
            manager,
            parsedMessage: updatedParsedMessage,
            global: botGlobal,
            userInfo: {
                id: message.senderID,
                name: uname,
                firstName: fname,
                balance: balance === 0n ? 0 : balance,
                exp,
                level
            },
            botInfo: botGlobal.botInfo?.data || null,
            ...utils
        }

        if (!botGlobal.botInfo) {
          botGlobal.botInfo = {
            data: null,
            callCount: 0,
          };
        }
        
        if (botGlobal.botInfo.callCount >= 4) {
            try {
                const botInfo = (await api.getUserInfo(botId))[botId];
            
                botGlobal.botInfo.data = botInfo;
                botGlobal.botInfo.callCount = 0;
            
                Args.botInfo = botInfo;

                //   console.log("Successfully fetched bot info.");
            } catch (error) {
                console.warn("⚠️ Error fetching bot info:", error);
            }
        } else {
                botGlobal.botInfo.callCount += 1;
                // console.log(`Bot info has been requested ${botGlobal.botInfo.callCount} times, no need to fetch again.`);
            }



        await commandModule.default.execute(Args);
    } catch (err) {
        console.log(chalk.red(`❌ Lỗi khi chạy command ${body}:`), err);
        api.sendMessage(`⚠️ Có lỗi xảy ra khi thực thi lệnh: ${body}`, message.threadID);
    }
};
