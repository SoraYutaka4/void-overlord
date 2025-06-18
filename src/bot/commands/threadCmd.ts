export default {
    info: {
      name: "boxcommand",
      description: "Quản lý lệnh nhóm",
      version: "1.0.0",
      prefix: true,
      permission: "admin",
      usage: "boxcommand <disabled|toggle> <name> [on/off]",
      example: [
        "boxcommand disabled",         
        "boxcommand toggle on greet", 
        "boxcommand toggle off joke"    
      ],
      aliases: [
        "boxcmd", "threadcmd", "groupcmd", "nhomcmd",
        "threadcommand", "groupcommand", "nhomcommand",
      ],
      category: "Admin",
      hidden: true,
      credits: "NPK31"
    },
  
    execute: async ({api, message, manager, parsedMessage, global}) => {
      const args = parsedMessage.args;
      const method = args[1]; 
  
      try {
        if (method === "disabled") {
          const disabledCommands = Array.isArray(global.commandDisabled[message.threadID]) ? global.commandDisabled[message.threadID] : [];
  
          if (disabledCommands.length === 0) {
            return api.sendMessage("Chưa có lệnh nào bị tắt trong nhóm đâu nha 😅", message.threadID);
          }
  
          api.sendMessage(
            `📦 Đây là danh sách lệnh bị tắt trong nhóm:\n ${disabledCommands.join("\n ")}`,
            message.threadID
          );
          return;
        }
  
        if (method === "toggle") {
          const state = args[2];
          const name = args[3];
  
          if (!name || !["on", "off"].includes(state)) {
            return api.sendMessage("⚠️ Dùng: boxcommand toggle <on/off> <name>", message.threadID);
          }
  
          const commandIndex = manager.commands.findIndex(
            (cmd) => Array.isArray(cmd.name) ? cmd.name.includes(name) : cmd.name === name
          );
  
          if (commandIndex === -1) {
            return api.sendMessage(`⚠️ Lệnh ${name} không tồn tại.`, message.threadID);
          }

          if (!global.commandDisabled) global.commandDisabled = {};
          if (!global.commandDisabled[message.threadID]) global.commandDisabled[message.threadID] = [];
  
          const disabledCommands = Array.isArray(global.commandDisabled[message.threadID]) ? global.commandDisabled[message.threadID] : [];
  
          const isDisabled = disabledCommands.includes(name);
          
          if (state === "off" && !isDisabled) {
            disabledCommands.push(name);
            global.commandDisabled[message.threadID] = disabledCommands;
            api.sendMessage(`✅ Đã tắt lệnh ${name} trong nhóm.`, message.threadID);
          } 
          else if (state === "on" && isDisabled) {
            global.commandDisabled[message.threadID] = disabledCommands.filter((cmd: string) => cmd !== name);
            api.sendMessage(`✅ Đã bật lệnh ${name} trong nhóm.`, message.threadID);
          } 
          else {
            api.sendMessage(`ℹ️ Lệnh ${name} đã ở trạng thái ${state} rồi.`, message.threadID);
          }
  
          return;
        }
        
      } catch (error) {
        console.error("❌ Đã xảy ra lỗi khi thực hiện lệnh: ", error);
        api.sendMessage("⚠️ Đã xảy ra lỗi khi xử lý yêu cầu.", message.threadID);
      }
    }
  } satisfies import("../types").BotCommand;
  