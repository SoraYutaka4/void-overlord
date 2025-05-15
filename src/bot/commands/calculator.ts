export default {
  info: {
    name: "(\\d+(\\.\\d+)?(\\s*[-+\\/*^%]\\s*\\d+(\\.\\d+)?)+)\\s*=\\?",
    description: "Máy tính mini",
    version: "1.2.0",
    prefix: false,
    hidden: true,
    offline: true,
    category: "NPK31",
    cooldown: 2000
  },

  execute: ({ api, message, parsedMessage }) => {
    const body = parsedMessage.body.trim();
    const match = body.match(/^(.+)=\s*\?$/);
    if (!match) return;

    let expression = match[1].trim();

    if (!/^[\d\s+\-*/^%().]+$/.test(expression)) {
      return api.sendMessage("🚫 Chỉ hỗ trợ các phép tính: +, -, *, /, ^, % và số!", message.threadID);
    }

    expression = expression.replace(/(\d+(\.\d+)?|\(.+?\))\s*\^\s*(\d+(\.\d+)?|\(.+?\))/g, (match, base, _, exponent) => {
      return `Math.pow(${base}, ${exponent})`;
    });

    try {
      const result = evaluateSafe(expression);
      api.sendMessage(`${result}`, message.threadID);
    } catch (err) {
      api.sendMessage("⚠️ Biểu thức không hợp lệ hoặc có lỗi khi tính toán.", message.threadID);
    }
  },
} satisfies import("../types").BotCommand;


function evaluateSafe(expression: string): number {
  const safeExpression = expression.replace(/[^\d+\-*/().^%]/g, '');
  
  try {
    return eval(safeExpression);
  } catch (err) {
    throw new Error("Lỗi khi đánh giá biểu thức.");
  }
}