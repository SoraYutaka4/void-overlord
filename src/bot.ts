process.on('unhandledRejection', (reason) => {
  console.error("❌ Unhandled promise rejection:", reason);
});

import { VoidSortie, API, Message as Event } from "./bot/VoidOverlord";
import path from "path";
import fs from "fs";
import login from "ws3-fca";

login(
  { appState: JSON.parse(fs.readFileSync(path.resolve(__dirname, "../appstate.json"), "utf8")) },
  {
    updatePresence: true,
    autoMarkDelivery: true,
    autoMarkRead: true,
    selfListen: true,
    online: true,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  },
  async (err, api) => {
    if (err) {
      console.error("💥 Login error:", err);
      return;
    }
    const botID = api.getCurrentUserID();
    console.log("🤖 Bot is online with ID:", botID);

    VoidSortie({
      DataRelay: (callback: (api: API, message: Event) => void) => {
        api.listenMqtt(async (err, event) => {
          if (err) {
            console.error("❌ Listen error:", err);
            return;
          }
          const { type } = event;
          if ((type === "message" || type === "message_reply") && event.senderID === botID) return;
          callback(api as unknown as API, event);
        });
      },
      config: {
        cache: {
          log: {
            debug: false,
            info: ["loaded"],
          },
        },
        obfuscateText: true,
        delay: {
          send: { min: 2.75, max: 4.5 }
        },
        emojiDrop: {
          enabled: false,
          chance: 0.05,
          emojis: ["👍", "😳", "☠", "😉"],
          delay: { min: 15, max: 30 },
        },
      },
    });
  }
);
