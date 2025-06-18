import { Event, Message } from "../types";

export function isMessageEvent(event: Event): event is { type: "message"; message: Message } | { type: "message_reply"; message: Message } {
    return event.type === "message" || event.type === "message_reply";
}

export function isTimePassed (M: number, d: number, h: number, m: number, s: number): boolean {
    const currentTime = new Date();
    const time = {
      M: currentTime.getMonth() + 1,
      d: currentTime.getDate(),
      h: currentTime.getHours(),
      m: currentTime.getMinutes(),
      s: currentTime.getSeconds()
    };
  
    let futureSeconds = s + 10;
    let futureMinutes = m;
    if (futureSeconds >= 60) {
      futureSeconds -= 60;
      futureMinutes += 1;
    }
  
    if (M !== time.M) return M < time.M;
    if (d !== time.d) return d < time.d;
    if (h !== time.h) return h < time.h;
    if (m !== time.m) return m < time.m;
    return s <= futureSeconds;
  };