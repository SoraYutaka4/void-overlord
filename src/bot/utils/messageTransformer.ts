import ObfuscateText from "./textObfuscate";
import { API, New_Message } from "../types";
import { Readable } from "stream";

export async function applyDelay(min: number = 1500, max: number = 3000): Promise<void> {
    const delayTime = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delayTime));
}

function isNewMessage(obj: any): obj is New_Message {
    if (typeof obj !== "object" || obj === null) return false;
    
    if (obj.body !== undefined && typeof obj.body !== "string") return false;

    if (obj.attachment !== undefined) {
        let attachment = obj.attachment;

        if (!Array.isArray(attachment)) {
            attachment = [attachment];
        }
        
        if (attachment.length === 0) return false;

        for (const att of attachment) {
            if (!(att instanceof Readable) && !(att instanceof Buffer) && typeof att !== "string") {
                return false;
            }
        }
    }

    if (obj.mentions !== undefined) {
        if (!Array.isArray(obj.mentions)) return false;
        for (const mention of obj.mentions) {
            if (typeof mention.tag !== "string" || typeof mention.id !== "string") {
                return false;
            }
        }
    }

    if (obj.sticker !== undefined && typeof obj.sticker !== "string") return false;
    if (obj.replyTo !== undefined && typeof obj.replyTo !== "string") return false;
    if (obj.url !== undefined && typeof obj.url !== "string") return false;

    return true;
}

export type Options = {
    obfuscateText?: boolean;
    delay?: {
        send?: {
            min?: number;
            max?: number;
        },
        typing?: {
            min?: number;
            max?: number;
        }
    };
    typingIndicator?: boolean,
};

function prepareMessage(message: string | New_Message, obfuscate: boolean): New_Message {
    let messageObj: New_Message;

    if (typeof message === "string") {
        messageObj = { body: message };
    } else if (isNewMessage(message)) {
        messageObj = message;
    } else {
        throw new Error("Invalid message format");
    }

    if (obfuscate && messageObj.avoid?.obfuscate !== false) {
        if (messageObj.body) {
            const useEmoji = typeof messageObj.avoid?.emoji === "boolean" ? messageObj.avoid?.emoji : true;
            messageObj.body = ObfuscateText(messageObj.body, useEmoji);
        }
    }

    return messageObj;
}


const messageQueue = new Map<string, Promise<any>>();
const queueTimeoutMap = new Map<string, NodeJS.Timeout>();
const messageQueuePendingCount = new Map<string, number>();

const delayPerMessage = 1250;
const QUEUE_TIMEOUT = 30_000;
const MAX_QUEUE_LENGTH = 10;
const HIGH_LOAD_THRESHOLD = 5;

const cleanupQueue = (threadID: string) => {
  messageQueue.delete(threadID);
  queueTimeoutMap.delete(threadID);
  messageQueuePendingCount.delete(threadID);
  console.warn(`🧹 Queue for thread ${threadID} has been cleared due to error.`);
};

const BotNinja = (api: API, options: Options = {}): API => ({
  ...api,
  sendMessage: async (message, threadID, callback, messageID): Promise<any> => {
    const currentPending = messageQueuePendingCount.get(threadID) ?? 0;

    if (!messageQueue.has(threadID)) {
      messageQueue.set(threadID, Promise.resolve());
    }
    

    if (currentPending >= MAX_QUEUE_LENGTH) {
      console.warn(`⚠️ Queue for thread ${threadID} is full. Removing oldest message to make space.`);
      const currentQueuePromise = messageQueue.get(threadID)!;
      const newQueuePromise = currentQueuePromise.then(() => {});

      messageQueue.set(threadID, newQueuePromise);
      messageQueuePendingCount.set(threadID, Math.max(0, currentPending - 1));
    }

    messageQueuePendingCount.set(threadID, currentPending + 1);

    const messageObj = prepareMessage(message, options.obfuscateText ?? false);
    const queue = messageQueue.get(threadID)!;
    let queue_timeout = QUEUE_TIMEOUT;

    if (currentPending > HIGH_LOAD_THRESHOLD) {
      console.warn(`⚡ Queue for thread ${threadID} has more than 5 pending messages. Reducing timeout to 500ms.`);
      queue_timeout = 500;
    }

    if (typeof messageObj.avoid?.queue === "number") {
      const customTimeout = parseInt(messageObj.avoid.queue.toString());
      if (!isNaN(customTimeout) && customTimeout > 0 && customTimeout < 10000) {
        queue_timeout = customTimeout;
      } else if (!isNaN(customTimeout)) {
        console.warn(`⚠️ Invalid custom queue timeout value (${customTimeout}ms). Please use a value between (0, 10000) ms. Using default value: ${delayPerMessage}ms.`);
      }
    }

    if (queueTimeoutMap.has(threadID)) {
      clearTimeout(queueTimeoutMap.get(threadID)!);
    }

    queueTimeoutMap.set(
      threadID,
      setTimeout(() => {
        cleanupQueue(threadID);
      }, queue_timeout)
    );

    const newQueue: Promise<any> = queue.then(async (): Promise<any> => {
      try {
        const delayMinSend = options.delay?.send?.min ?? 1500;
        const delayMaxSend = options.delay?.send?.max ?? 3000;
        const delayMinTyping = options.delay?.typing?.min ?? 500;
        const delayMaxTyping = options.delay?.typing?.max ?? 1500;

        const hasAttachment = Array.isArray(messageObj.attachment)
        ? messageObj.attachment.length > 0
        : !!messageObj.attachment;
      
        if (!(messageObj.body || hasAttachment || messageObj.sticker || messageObj.url)) {
          console.error("⚠️ Message is empty, skipping send.");
          return;
        }

        if (options.typingIndicator) {
          try {
            await new Promise<void>((resolve) => {
              api.sendTypingIndicator(threadID, (err) => {
                if (err) console.error(`😥 Error showing typing indicator: ${err}`);
                resolve();
              });
            });
            if (messageObj.avoid?.delay !== false) await applyDelay(delayMinTyping, delayMaxTyping);
          } catch (err) {
            console.error("❌ Typing indicator error:", err);
          }
        }

        if (messageObj.avoid?.delay !== false) await applyDelay(delayMinSend, delayMaxSend);

        const finalMessageObj: New_Message = { ...messageObj };

        if (messageObj.attachment) {
          if (!Array.isArray(messageObj.attachment)) {
            finalMessageObj.attachment = [messageObj.attachment];
          } else {
            finalMessageObj.attachment = messageObj.attachment;
          }
        }
        
        delete finalMessageObj.avoid;
        delete finalMessageObj.randomImage;

        return await new Promise((resolve, reject) => {
          api.sendMessage(finalMessageObj, threadID, (err, info) => {
            if (callback) callback(err, info);
            if (err) {
              console.error("❌ Error sending message:", err);
              reject(err);
            } else {
              resolve(info);
            }
          }, messageID);
        });

      } catch (error) {
        console.error("❌ Error in sendMessage:", error);
        throw error;
      } finally {
        try {
          await new Promise(res => setTimeout(res, delayPerMessage));
        } catch (error) {
          console.error("❌ Error in delay:", error);
        }

        const remaining = Math.max((messageQueuePendingCount.get(threadID) ?? 1) - 1, 0);
        if (remaining <= 0) {
          messageQueuePendingCount.delete(threadID);
        } else {
          messageQueuePendingCount.set(threadID, remaining);
        }
      }
    }).catch((err) => {
      console.error("❌ Error in message queue:", err);
      cleanupQueue(threadID);
      return Promise.reject(err);
    });

    if (messageObj.avoid?.queue !== false){
      messageQueue.set(threadID, newQueue);
    }

    return newQueue;
  }
});


export default BotNinja;
