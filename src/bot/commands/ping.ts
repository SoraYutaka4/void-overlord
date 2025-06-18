export default {
    info: {
        name: "ping",
        description: "test",
        version: "1.0.0",
        prefix: true,
        aliases: ["p", "pt"],
        category: ["Info"],
    },

    execute: ({api, message}) =>{
        api.sendMessage("🏓 Pong", message.threadID);
    }
} satisfies import("../types").BotCommand;