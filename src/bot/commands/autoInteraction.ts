import groupInteractions from "./groupInteractions";

export default {
  info: {
    name: "autotuongtac",
    description: "Tự động gửi tương tác nhóm lặp lại",
    version: "1.3.1",
    prefix: true,
    credits: "NPK31",
    category: "Info",
    permission: "owner",
    hidden: true,
  },

  execute: ({ api, message, parsedMessage, global, ...rets }) => {
    const args = parsedMessage.args.slice(1);
    const intervalArg = args[0];

    if (!global.scheduleJobs001) global.scheduleJobs001 = {};
    const jobs = global.scheduleJobs001;
    const threadId = message.threadID;

    if (!intervalArg) {
      return api.sendMessage(
        "❗ Dùng: autotuongtac <thời_gian|off>\n" +
        "VD: autotuongtac 1h / autotuongtac 30m / autotuongtac 10s / autotuongtac off",
        threadId
      );
    }

    if (["off", "false", "tắt", "tat"].includes(intervalArg.toLowerCase())) {
      if (jobs[threadId]) {
        jobs[threadId].cancel();
        delete jobs[threadId];
        return api.sendMessage("✅ Đã tắt auto tương tác nhóm.", threadId);
      } else {
        return api.sendMessage("⚠️ Auto tương tác đã tắt sẵn rồi.", threadId);
      }
    }

    const timeValue = parseInt(intervalArg);
    const timeUnit = intervalArg.replace(timeValue.toString(), "").toLowerCase();

    if (isNaN(timeValue) || timeValue <= 0 || !["s", "m", "h"].includes(timeUnit)) {
      return api.sendMessage("❌ Định dạng không hợp lệ. VD: 10s, 30m, 1h.", threadId);
    }

    if (jobs[threadId]) {
      jobs[threadId].cancel();
    }

    const intervalMs =
      timeUnit === "s"
        ? timeValue * 1000
        : timeUnit === "m"
        ? timeValue * 60 * 1000
        : timeValue * 60 * 60 * 1000;

    const job = setInterval(() => {
      groupInteractions.execute({
        ...rets,
        message: { ...message, body: "tuongtacnhom" },
        api,
        parsedMessage: { body: "tuongtacnhom", args: ["tuongtacnhom"], query: {} },
        global
      });
    }, intervalMs);

    jobs[threadId] = {
      cancel: () => clearInterval(job)
    };

    api.sendMessage(`✅ Đã bật auto tương tác mỗi ${timeValue}${timeUnit}`, threadId);
  },
} satisfies import("../types").BotCommand;
