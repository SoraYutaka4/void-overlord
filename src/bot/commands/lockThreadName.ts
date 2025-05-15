export default {
    info: {
      name: "event:threadname",
      description: "Chống thay đổi tên nhóm",
      version: "1.0.0",
      prefix: false,
      hidden: true,
      credits: "NPK31",
    },
  
    execute: async ({ api, message, global }) => {
      if (message.type !== "event" || message.logMessageType !== "log:thread-name") return;
  
      const threadID = message.threadID;
      const newThreadName = message.logMessageData?.name;
  
      if (!global.lockNameSettings) global.lockNameSettings = {};
      if (!global.lockNameSettings[message.threadID]) global.lockNameSettings[message.threadID] = {};
  
      const { isLockName, boxName } = global.lockNameSettings[threadID] || {};
  
      if (!isLockName || !boxName) return;
  
      if (newThreadName && newThreadName !== boxName) {
        try {
          await api.setTitle(boxName, threadID);
          await api.sendMessage(`👀 Cái tên nhóm này không được thay đổi! Đã tự động phục hồi tên nhóm.`, threadID);
          console.log(`🔒 Đã khóa tên nhóm thành: ${boxName}`);
        } catch (err) {
          console.error("❌ Lỗi khi chặn đổi tên nhóm:", err);
        }
      }
    },
  } satisfies import("../types").BotEvent;