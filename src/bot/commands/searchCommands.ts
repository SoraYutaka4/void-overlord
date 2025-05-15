import { Command, CM, BotCommand } from "../types";

function searchRelatedCommands(
  input: string,
  manager: CM,
  prefix: string,
  isAdmin: boolean
): Command[] {
  const lowerInput = input.trim().toLowerCase();

  if (!manager.commands?.length) return [];

  return manager.commands.filter((cmd) => {
    if ((cmd.permission === "admin" || cmd.hidden) && !isAdmin) return false;

    const requiresPrefix = cmd.prefix !== false;

    const names = [
      ...(typeof cmd.name === "string" ? [cmd.name] : cmd.name || []),
      ...(cmd.aliases || [])
    ].map(n => n.toLowerCase());

    return names.some(alias => {
      const fullAlias = requiresPrefix ? `${prefix}${alias}` : alias;

      if (/\(.*\)/.test(fullAlias)) {
        try {
          const regex = new RegExp(fullAlias);
          return regex.test(lowerInput);
        } catch (err) {
          console.warn("❗ Invalid regex alias:", fullAlias);
          return false;
        }
      }

      return (
        fullAlias.includes(lowerInput) || 
        lowerInput.includes(fullAlias) || 
        lowerInput.startsWith(fullAlias)
      );
    });
  });
}

export default {
  info: {
    name: "timlenh",
    description: "Tìm kiếm lệnh theo từ khóa",
    version: "1.0.0",
    prefix: true,
    aliases: ["search", "searchcmd", "searchcommand"],
    credits: "NPK31",
    usage: "timlenh <từ khóa>",
    example: [
      "timlenh bank",
      "timlenh work",
      "timlenh game"
    ]
  },

  execute: ({ api, message, manager, parsedMessage, getPrefix, admin, owner }) => {
    const keyword = parsedMessage.args.slice(1).join(" ");

    if (!keyword) {
      return api.sendMessage("⚠️ Vui lòng nhập từ khóa để tìm lệnh.", message.threadID);
    }

    const isAdmin = admin.is(message.senderID);
    const prefix = getPrefix();

    const relatedCommands = searchRelatedCommands(keyword, manager, prefix, isAdmin)
      .filter(cmd => {
        if (cmd.permission !== "owner" || isAdmin) return true;
        return owner.any(message.senderID, [
          ...(cmd.aliases ?? []),
          ...(Array.isArray(cmd.name) ? cmd.name : [cmd.name])
        ]);
      });

    if (relatedCommands.length === 0) {
      return api.sendMessage(`❌ Không tìm thấy lệnh nào liên quan đến "${keyword}".`, message.threadID);
    }

    const formatted = relatedCommands.map((cmd, index) => {
      const names = typeof cmd.name === "string" ? [cmd.name] : cmd.name;
      return `🔹 ${index + 1}. ${names[0]}`;
    }).join("\n");

    return api.sendMessage(`🔍 Kết quả tìm kiếm cho từ khóa: "${keyword}"\n\n${formatted}`, message.threadID);
  },
} satisfies BotCommand;