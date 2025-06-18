export default {
    info: {
      name: "auto-welcome",
      description: "Tự động chào đón người mới",
      version: "1.0.1",
      prefix: true,
      permission: "owner",
      credits: "NPK31"
    },
  
    execute: ({ api, message, global, parsedMessage, normalizeText }) => {
      const state = normalizeText(parsedMessage.args[1] ?? "");
  
      if (!state) {
        global.autoWelcome = !global.autoWelcome;
      } else if (["on", "bat"].includes(state)) {
        global.autoWelcome = true;
      } else if (["off", "tat"].includes(state)) {
        global.autoWelcome = false;
      } else {
        return api.sendMessage("⚠️ Sai cú pháp! Dùng: auto-welcome [on/off]", message.threadID);
      }
  
      api.sendMessage(`✅ Auto Welcome hiện đang ${global.autoWelcome ? "[ Bật ]" : "[ Tắt ]"}.`, message.threadID);
    },
  } satisfies import("../types").BotCommand;
  