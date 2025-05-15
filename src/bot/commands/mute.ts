export default {
  info: {
    name: "mute",
    description: "Tắt bot trong nhóm",
    version: "1.0.0",
    prefix: true,
    hidden: true,
  },

  execute: async ({api, message, blacklist, admin}) =>{
    const threadInfo = await api.getThreadInfo(message.threadID);

    if (!threadInfo.isGroup) {
        api.sendMessage("📍 Lệnh này chỉ có thể sử dụng trong nhóm", message.threadID, undefined, message.messageID);
        return;
    }

    if (!threadInfo.adminIDs.some((admin) => admin === message.senderID) && !admin.is(message.senderID)) {
        api.sendMessage("❌ Bạn không có quyền để sử dụng lệnh này", message.threadID, undefined, message.messageID);
        return;
    }

    const isMuted = blacklist.is("threads", message.threadID);

    if (isMuted){
        blacklist.remove("threads", message.threadID);
        api.sendMessage("🔊 Bot đã được bật lại trong nhóm này", message.threadID);
    } else {
        blacklist.add("threads", message.threadID);
        api.sendMessage("🔇 Bot đã bị tắt trong nhóm này", message.threadID);
    }

    api.setMessageReaction("❤", message.messageID, (err) => {
        if (err) {
            console.error("Error setting reaction:", err);
        }
    });

  },
} satisfies import("../types").BotCommand;