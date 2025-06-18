export default {
  info: {
    name: "auto-bye",
    description: "Tự động gửi lời tạm biệt",
    version: "1.0.0",
    prefix: true,
    permission: "owner",
    credits: "NPK31"
  },

  execute: ({api, message, parsedMessage, normalizeText, global}) =>{
    const state = normalizeText(parsedMessage.args[1] ?? "");
  
      if (!state) {
        global.autoGoodBye = !global.autoGoodBye;
      } else if (["on", "bat"].includes(state)) {
        global.autoGoodBye = true;
      } else if (["off", "tat"].includes(state)) {
        global.autoGoodBye = false;
      } else {
        return api.sendMessage("⚠️ Sai cú pháp! Dùng: auto-welcome [on/off]", message.threadID);
      }
  
      api.sendMessage(`✅ Auto Welcome hiện đang ${global.autoGoodBye ? "[ Bật ]" : "[ Tắt ]"}.`, message.threadID);
  },
} satisfies import("../types").BotCommand;