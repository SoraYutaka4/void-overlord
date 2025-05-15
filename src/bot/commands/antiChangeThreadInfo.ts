export default {
  info: {
    name: "chongdoi",
    description: "Anti thay đổi thông tin của nhóm",
    version: "1.0.0",
    prefix: true,
    aliases: ["khoagroup", "lockgroup", "lockbox", "boxguard", "baovebox", "groupguard", "baovenhom"],
    credits: "NPK31",
  },

  execute: async ({ api, message, global, admin, cprompt, normalizeText }) => {
    try {
      const isAdminBot = admin.is(message.senderID);
      const groupInfo = await api.getThreadInfo(message.threadID);
      const idsAdminGroup = groupInfo.adminIDs;

      if (!(isAdminBot || idsAdminGroup.includes(message.senderID))) {
        return api.sendMessage("Bạn không có quyền thực hiện lệnh này!", message.threadID);
      }

      const list: Record<string, { on: () => void; off: () => void }> = {
        "Anti đổi tên nhóm": {
          on: () => {
            if (!global.lockNameSettings) global.lockNameSettings = {};
            global.lockNameSettings[message.threadID] = {
              boxName: groupInfo.threadName,
              isLockName: true
            };
            api.sendMessage("✅ Đã bật chống đổi tên nhóm!", message.threadID);
          },
          off: () => {
            if (!global.lockNameSettings) global.lockNameSettings = {};
            global.lockNameSettings[message.threadID] = { isLockName: false };
            api.sendMessage("✅ Đã tắt chống đổi tên nhóm!", message.threadID);
          }
        },
        "Anti đổi ảnh nhóm": {
          on: () => {
            if (!global.lockImageSettings) global.lockImageSettings = {};
            global.lockImageSettings[message.threadID] = {
              image: groupInfo.imageSrc,
              isLock: true
            };
            api.sendMessage("✅ Đã bật chống đổi ảnh nhóm!", message.threadID);
          },
          off: () => {
            if (!global.lockImageSettings) global.lockImageSettings = {};
            global.lockImageSettings[message.threadID] = { isLock: false };
            api.sendMessage("✅ Đã tắt chống đổi ảnh nhóm!", message.threadID);
          }
        }
      };

      const listContent = Object.entries(list)
        .map(([key], index) => `${index + 1}. ${key}`)
        .join("\n");

      api.sendMessage(`Vui lòng chọn tính năng bạn muốn cấu hình (nhập số):\n${listContent}`, message.threadID);

      cprompt.create(message.senderID, async (msg, responseParsedMessage) => {
        const { args } = responseParsedMessage;
        const num = parseInt(args[0]);
        const state = normalizeText(args[1] ?? "");

        if (isNaN(num) || num < 1 || num > Object.keys(list).length || !state || !["on", "off", "bat", "tat"].includes(state)) {
          return api.sendMessage("⚠️ Lựa chọn không hợp lệ.\n📝 Vui lòng nhập số thứ tự và trạng thái (on/off).", message.threadID);
        }

        const selectedFeatureKey = Object.keys(list)[num - 1];
        const selectedFeature = list[selectedFeatureKey as keyof typeof list];
        const action = ["on", "bat"].includes(state) ? "on" : "off";

        selectedFeature[action]();
      }, null);

    } catch (error) {
      console.error("❌ Lỗi khi thực hiện lệnh boxanti:", error);
      api.sendMessage("❌ Đã xảy ra lỗi khi cấu hình chống thay đổi thông tin nhóm.", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;
