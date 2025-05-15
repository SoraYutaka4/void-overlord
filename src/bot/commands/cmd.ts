import { readDisabledCommands, toggleCommand } from "../utils/command";

export default {
    info: {
        name: "command",
        description: "Quản lý lệnh",
        version: "1.0.0",
        prefix: true,
        permission: "admin",
        usage: "command <disabled|toggle> <name> [on/off]",
        example: [
          "cmd disabled",         
          "cmd toggle on greet", 
          "cmd toggle off joke"    
        ],
        category: "Admin",
        hidden: true,
        credits: "NPK31"
      },

  execute: async ({api, message, manager, parsedMessage}) =>{
    const args = parsedMessage.args;
    const method = args[1]; 
    
    try {
      if (method === "disabled") {
        const result = readDisabledCommands();

        if (!result || result.length === 0) {
          return api.sendMessage("Chưa có lệnh nào đi ngủ đâu nha 😅", message.threadID);
        }

        api.sendMessage(
          `📦 Đây là danh sách lệnh đang ngủ:\n ${result.join("\n ")}`,
          message.threadID
        );
        return;
      }

      if (method === "toggle") {
        const name = args[3];
        const state = args[2];

        if (!name || !["on", "off"].includes(state)) {
          return api.sendMessage("⚠️ Dùng: command toggle <on/off> <name>", message.threadID);
        }

        const commandIndex = manager.commands.findIndex(
          (cmd) => Array.isArray(cmd.name) ? cmd.name.includes(name) : cmd.name === name
        );

        if (commandIndex === -1) {
          return api.sendMessage(`⚠️ Lệnh '${name}' không tồn tại.`, message.threadID);
        }

        const isEnabling = state === "on";
        const currentlyDisabled = manager.commands[commandIndex].disabled;

        if (currentlyDisabled === !isEnabling) {
          return api.sendMessage(`ℹ️ Lệnh '${name}' đã ở trạng thái ${state}.`, message.threadID);
        }

        manager.commands[commandIndex].disabled = !isEnabling;

        let commandName: string | undefined;

        if (Array.isArray(manager.commands[commandIndex].name)) {
          commandName = manager.commands[commandIndex].name.find((name) => name.trim() !== "");
        } else if (typeof manager.commands[commandIndex].name === "string") {
          commandName = manager.commands[commandIndex].name.trim();
        }

        if (commandName) {
          toggleCommand(commandName, isEnabling ? "enable" : "disable");
        } else {
          console.warn(`⚠️ Không tìm thấy tên lệnh hợp lệ cho module '${name}' tại index ${commandIndex}.`);
          return api.sendMessage(`⚠️ Không thể thực hiện yêu cầu trên module '${name}' do tên lệnh không hợp lệ.`, message.threadID);
        }

        api.sendMessage(`✅ Đã ${isEnabling ? "bật" : "tắt"} Lệnh '${name}'.`, message.threadID);
        return;
      }
      
    } catch (error) {
      console.error("❌ Đã xảy ra lỗi khi thực hiện lệnh: ", error);
      api.sendMessage("⚠️ Đã xảy ra lỗi khi xử lý yêu cầu.", message.threadID);
    }
  }
} satisfies import("../types").BotCommand;
