import categories from "./categories";

export default {
  info: {
    name: ["game", "tienich", "tool", "extension"],
    description: "Shortcut",
    version: "1.0.0",
    prefix: true,
    hidden: true,
    cooldown: 2500
  },
  execute: ({ parsedMessage, ...rest }) => {
    const shortcut = parsedMessage.args[0].endsWith("game") ? "game" : "tienich";
    categories.execute({
      ...rest,
      parsedMessage: {
        body: `danhmuc ${shortcut}`,
        args: ["danhmuc", shortcut],
        query: {}
      }
    });
  }
} satisfies import("../types").BotCommand;
