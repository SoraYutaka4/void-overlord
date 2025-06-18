import schedule from "node-schedule";

function parseTimeToDate(input: string): Date | null {
  const now = new Date();
  const match = input.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s": now.setSeconds(now.getSeconds() + value); break;
    case "m": now.setMinutes(now.getMinutes() + value); break;
    case "h": now.setHours(now.getHours() + value); break;
    case "d": now.setDate(now.getDate() + value); break;
  }

  return now;
}

export default {
  info: {
    name: "hengio",
    description: "Hẹn giờ nhắc nhở",
    version: "1.0.0",
    prefix: true,
    aliases: ["remind"],
    credits: "NPK31",
    category: "Tool",
    rules: {
      balance: 1000
    }
  },

  execute: async ({ api, message, parsedMessage, normalizeText, global, styleText }) => {
    const send = (msg: string | object) => api.sendMessage(msg, message.threadID);
    const args = parsedMessage.args;
    const method = normalizeText(args[1]?.toLowerCase() || "");

    if (!global.scheduler) global.scheduler = new Map<string, schedule.Job>();
    if (!global.remindCount) global.remindCount = 0;
    if (!global.userReminds) global.userReminds = new Map<string, string[]>(); 

    const jobsMap = global.scheduler;
    const userReminds = global.userReminds;

    if (["hen", "dat", "set", "add", "them"].includes(method)) {
      const timeInput = args[2];
      const content = args.slice(3).join(" ");
      if (!timeInput || !content) {
        return send("⏳ Cú pháp: hengio hen [10s/1m/1h] [nội dung nhắc]");
      }

      const userJobs = userReminds.get(message.senderID) || [];

      if (userJobs.length >= 3) {
        return send("🚫 Bạn chỉ được tạo tối đa 3 lịch hẹn cùng lúc. Hãy huỷ bớt rồi thử lại.");
      }

      const targetTime = parseTimeToDate(timeInput);
      if (!targetTime) {
        return send("⚠️ Định dạng thời gian không hợp lệ.\nDùng số + s/m/h/d (ví dụ 10s, 1m).");
      }

      const remindCount = ++global.remindCount;
      const jobName = remindCount.toString().padStart(3, "0");

      const job = schedule.scheduleJob(jobName, targetTime, () => {
        api.sendMessage({
            body: ` ${styleText("【🔔 Nhắc nhở 】", "boldSerif")}\n${content}`,
            avoid: {
                obfuscate: false,
                delay: false
            }
        }, message.threadID);
        jobsMap.delete(jobName);

        const jobs = userReminds.get(message.senderID);
        if (jobs) {
          const updated = jobs.filter((j: string) => j !== jobName);
          if (updated.length === 0) userReminds.delete(message.senderID);
          else userReminds.set(message.senderID, updated);
        }
      });


        jobsMap.set(jobName, job);
        userJobs.push(jobName);
        userReminds.set(message.senderID, userJobs);

        const fullTime = targetTime.toLocaleString("vi-VN", { hour12: false });
        return send({
            body: 
            `⏰ ${styleText("Đã hẹn giờ nhắc nhở!", "boldSansSerif")}
            ➥ ${styleText(`ID`, "boldSerif")}: ${jobName}
            ➥ ${styleText(`Thời gian`, "boldSerif")}: ${timeInput} (${fullTime})
            ➥ ${styleText("Nội dung", "boldSerif")}:\n『 ${content} 』`,
            avoid: {
                obfuscate: false,
            }
        });
    }

    if (["go", "bo", "huy", "cancel", "remove", "delete"].includes(method)) {
      const jobId = args[2];
      if (!jobId) return send("❗ Cú pháp: hengio huy [jobID]");

      const job = jobsMap.get(jobId);
      if (!job) return send("❌ Không tìm thấy lịch hẹn với ID đó.");

      job.cancel();
      jobsMap.delete(jobId);

      for (const [userId, jobList] of userReminds.entries()) {
        if (jobList.includes(jobId)) {
          const updated = jobList.filter((j: string) => j !== jobId);
          if (updated.length === 0) userReminds.delete(userId);
          else userReminds.set(userId, updated);
          break;
        }
      }

      return send(`🗑️ Đã huỷ lịch hẹn: ${jobId}`);
    }

    if (jobsMap.size === 0) {
      return send("📭 Hiện không có lịch hẹn nào đang hoạt động.");
    }

    const jobList = Array.from(jobsMap.entries() as Iterable<[string, schedule.Job]>)
    .map(([id, job]) => {
      const next = job.nextInvocation();
      let time = "⏰???";
  
      if (next) {
        const d = new Date(next.getTime());
        const hh = d.getHours().toString().padStart(2, "0");
        const mm = d.getMinutes().toString().padStart(2, "0");
        const ss = d.getSeconds().toString().padStart(2, "0");
        const dd = d.getDate().toString().padStart(2, "0");
        const mo = (d.getMonth() + 1).toString().padStart(2, "0");
        time = `${dd}/${mo} - ${hh}:${mm}:${ss}`;
      }
  
      return `╰┈➤ ${styleText(`ID:`, "boldSerif")} ${id} | ⏰ ${time}`;
    })
    .join("\n");

      send({body: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        🌟 ${styleText("Danh sách lịch hẹn đang hoạt động", "boldSansSerif")}
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ${jobList}`, avoid: {
            obfuscate: false
        }});
  },
} satisfies import("../types").BotCommand;
