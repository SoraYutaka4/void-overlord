import schedule from "node-schedule";

function clearAllSchedules() {
    Object.keys(schedule.scheduledJobs).forEach(jobName => {
      schedule.scheduledJobs[jobName].cancel();
      delete schedule.scheduledJobs[jobName];
    });
}

export default {
  info: {
    name: "clear-schedule",
    description: "Xóa tất cả schedule",
    version: "1.0.0",
    prefix: true,
    category: "Admin",
    permission: "admin",
    credits: "NPK31",
    hidden: true
  },

  execute: ({api, message}) =>{
    clearAllSchedules();
    api.sendMessage("Đã clear tất cả schedule", message.threadID);
  },
} satisfies import("../types").BotCommand;