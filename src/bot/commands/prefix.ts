export default {
  info: {
    name: "prefix",
    description: "Xem prefix hiện tại của bot",
    version: "1.0.0",
    prefix: true,
    credits: "NPK31",
  },

  execute: ({api, message, getPrefix}) =>{
    api.sendMessage(`👀 Prefix hiện tại của bot là: ${getPrefix()}`, message.threadID, undefined, message.messageID);
  },
} satisfies import("../types").BotCommand;