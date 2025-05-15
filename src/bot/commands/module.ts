import { getInjectedCommandsNameList, toggleCommand } from "../utils/command";
import { reloadModule } from "../utils/cache";
import path from "path";

export default {
  info: {
    name: "module",
    description: "Quản lý và điều khiển các lệnh mở rộng trong hệ thống.",
    version: "1.0.0",
    prefix: true,
    hidden: true,
    usage: "module <list|toggle> [on|off] [tên module]",
    example: [
      "module list",
      "module toggle on greet",
      "module toggle off joke"
    ],
    aliases: ["mod", "modules"],
    permission: "admin",
    category: "Admin",
    credits: "NPK31"
  },

  execute: async ({api, message, manager, parsedMessage}) =>{
    const args = parsedMessage.args;
    const method = args[1];

    try {
      if (method === "list") {
        const result = getInjectedCommandsNameList();
      
        if (!result) return api.sendMessage(`Ủa, danh sách trống trơn rồi... chẳng có gì hết. 😅`, message.threadID);
      
        api.sendMessage(
          {body: `📦 Danh sách lệnh mở rộng:\n - ${result.join("\n - ")}`, avoid: {
            obfuscate: false,
          }},
          message.threadID
        );
      
        return;
      }

      if (method === "toggle") {
        const name = args[3];
        const state = args[2];

        if (!name || !["on", "off"].includes(state)) {
          return api.sendMessage("⚠️ Dùng: module toggle <on/off> <name> ", message.threadID);
        }

        const commandFilePath = path.resolve(__dirname, "..", "cache", "temp", name, "plugin.ts");

        const module = await reloadModule(commandFilePath, {
          log: { debug: false, info: false },
        });

        if (!module || !module.default?.info) {
          return api.sendMessage(`⚠️ Không tìm thấy module '${name}'.`, message.threadID);
        }

        const commandIndex = manager.commands.findIndex((cmd) => path.basename(path.dirname(cmd.path)) === name);

        if (commandIndex === -1) {
          return api.sendMessage(`⚠️ Module '${name}' không được đăng ký.`, message.threadID);
        }

        const isEnabling = state === "on";
        const currentlyDisabled = manager.commands[commandIndex].disabled;

        if (currentlyDisabled === !isEnabling) {
          return api.sendMessage(`ℹ️ Module '${name}' đã ở trạng thái ${state}.`, message.threadID);
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

        api.sendMessage(`✅ Đã ${isEnabling ? "bật" : "tắt"} Module '${name}'.`, message.threadID);
      }
    } catch (error) {
      console.error("❌ Error in Command: ", error);
      api.sendMessage("⚠️ Đã xảy ra lỗi khi xử lý lệnh.", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
