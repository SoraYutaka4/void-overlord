import { VoidSortie } from "./bot/VoidOverlord";
import middleware from "./bot/services/middleware";

VoidSortie({
    DataRelay: middleware,
    config: {
        cache: {
            log: {
                debug: false,
                info: ["loaded"]
            }
        },
        typingIndicator: true,
        obfuscateText: true,
        delay: {
            send: {
                min: 0.01,
                max: 0.02
            },
            typing: {
                min: 0.01,
                max: 0.02
            }
        },
        df_cooldown: 1000,
        emojiDrop: {
            enabled: false
        }
    },
});