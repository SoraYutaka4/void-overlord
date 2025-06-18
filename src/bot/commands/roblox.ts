import axios from "axios";
import Jimp from "jimp";
import path from "path";
import fs from "fs";

type Friend = {
    id: number;
    name: string;
    displayName: string;
};

type FriendWithThumbnail = Friend & {
    thumbnail: string;
};

type Profile = {
    name: string,
    displayName: string,
    modelImage: string,
    status: string,
    created: string;
    friends: FriendWithThumbnail[]
}

const api = axios.create({
    timeout: 10000, 
});

let requestCount = 0;
const maxRequestsPerMinute = 60;
const requestWindow = 60 * 1000;

setInterval(() => {
    requestCount = 0;
}, requestWindow);

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await fn();
        } catch (err) {
            attempt++;
            if (attempt < retries) {
                const backoffDelay = delay * Math.pow(2, attempt); // Exponential backoff
                console.warn(`Retry ${attempt}/${retries} after error: ${err}, next attempt in ${backoffDelay}ms`);
                await new Promise((res) => setTimeout(res, backoffDelay));
            } else {
                throw err;
            }
        }
    }
    throw new Error('Failed after retries');
}

async function rateLimitedRequest(fn: () => Promise<any>) {
    if (requestCount >= maxRequestsPerMinute) {
        console.warn(`Rate limit reached. Waiting...`);
        await new Promise(resolve => setTimeout(resolve, requestWindow));
    }

    await new Promise(res => setTimeout(res, 500));

    requestCount++;
    return fn();
}

async function searchUsers(keyword: string) {
    const res = await withRetry(() => rateLimitedRequest(() => api.get(`https://users.roblox.com/v1/users/search`, {
        params: { keyword, limit: 10 },
    })));

    const userMap = res.data.data.reduce((acc: { [key: string]: number }, u: any) => {
        acc[u.name] = u.id;
        return acc;
    }, {});

    return userMap;
}

async function getUserInfo(userId: number | number[]) {
    if (Array.isArray(userId)) {
        const users = await Promise.all(userId.map(id =>
            withRetry(() => rateLimitedRequest(() => api.get(`https://users.roblox.com/v1/users/${id}`)))
                .then(res => res.data)
        ));
        return users;
    } else {
        const res = await withRetry(() =>
            rateLimitedRequest(() => api.get(`https://users.roblox.com/v1/users/${userId}`))
        );
        return res.data;
    }
}

async function getFriends(userId: number, limit = 5): Promise<FriendWithThumbnail[]> {
    const res = await withRetry(() =>
        rateLimitedRequest(() => api.get(`https://friends.roblox.com/v1/users/${userId}/friends`))
    );

    const friends: Friend[] = res.data.data.map((f: any) => ({
        id: f.id,
        name: f.name,
        displayName: f.displayName,
    }));

    const limitedFriends = friends.slice(0, limit);
    const validFriends = limitedFriends.filter((u) => typeof u.id === 'number' && u.id > 0);
    const validIds = validFriends.map((u) => u.id);

    if (validIds.length === 0) {
        console.warn('⚠ Không có ID hợp lệ để lấy thumbnail.');
        return validFriends.map((f) => ({
            ...f,
            thumbnail: '',
        }));
    }

    const [friendsInfo, thumbnails] = await Promise.all([
        getUserInfo(validIds),
        getUserThumbnail(validIds, "150x150", "Png"),
    ]);

    const thumbMap = new Map<number, string>();
    validIds.forEach((id, idx) => {
        thumbMap.set(id, thumbnails[idx]);
    });

    const result: FriendWithThumbnail[] = friendsInfo.map((f: any) => ({
        id: f.id,
        name: f.name,
        displayName: f.displayName,
        thumbnail: thumbMap.get(f.id) || '',
    }));

    return result;
}

async function getThumbnail(url: string, params: any, retries = 5, delay = 1500): Promise<string[]> {
    const ids = params.userIds.split(",").map((id: string) => id.trim());
    const results: string[] = new Array(ids.length).fill("");

    for (let i = 0; i < retries; i++) {
        const res = await api.get(url, { params });
        const data = res.data.data;

        let allCompleted = true;
        data.forEach((thumb: any, index: number) => {
            if (thumb.state === "Completed" && thumb.imageUrl) {
                results[index] = thumb.imageUrl;
            } else if (!results[index]) {
                allCompleted = false;
            }
        });

        if (allCompleted) {
            return results;
        }

        console.log(`Thumbnail state check ${i + 1}/${retries}, retrying...`);
        await new Promise((res) => setTimeout(res, delay));
    }

    throw new Error("Thumbnail generation failed after retries");
}

async function getUserThumbnail(userId: number | number[], size: string, format: string): Promise<string | string[]> {
    const ids = Array.isArray(userId) ? userId.join(",") : userId.toString();
    const url = `https://thumbnails.roblox.com/v1/users/avatar`;
    const thumbnails = await getThumbnail(url, { userIds: ids, size, format });

    return Array.isArray(userId) ? thumbnails : thumbnails[0];
}

async function getUserStatus(userId: number) {
    try {
        const response = await axios.post(`https://presence.roblox.com/v1/presence/users`, {
            userIds: [userId.toString()]
        });

        const userPresence = response.data.userPresences[0];

        if (userPresence) {
            const { userPresenceType, lastLocation, placeId, gameId } = userPresence;

            switch (userPresenceType) {
                case 2:
                    return {
                        status: "Playing",
                        gameId: gameId || "N/A",
                        placeId: placeId || "N/A",
                        lastLocation: lastLocation || "Unknown"
                    };
                case 0:
                    return {
                        status: "Offline",
                        lastLocation: "N/A"
                    };
                case 1:
                    return {
                        status: "Online",
                        lastLocation: lastLocation || "N/A"
                    };
                case 3:
                    return {
                        status: "Studio",
                        lastLocation: lastLocation || "N/A"
                    };
                case 4:
                    return {
                        status: "Hidden",
                        lastLocation: lastLocation || "N/A"
                    };
                default:
                    return { status: "Unknown" };
            }
        } else {
            return { status: "User not found" };
        }
    } catch (error) {
        console.error("Error fetching user status:", error);
        return { status: "Error" };
    }
}

async function createImage(profile: Profile, publicSrc: string, outputPath: string) {
    const p = (end: string, dir: string = publicSrc) => path.join(dir, end);

    try {
        const [baseImg, font32, font16, avatar, ...friendImgs] = await Promise.all([
            Jimp.read(p('img/profile1.png')),
            Jimp.loadFont(p("font/Inter_32_Bold.fnt")),
            Jimp.loadFont(p("font/Inter_24_Bold.fnt")),
            Jimp.read(profile.modelImage),
            ...profile.friends.slice(0, 3).map(f => Jimp.read(f.thumbnail))
        ]);

        avatar.resize(215, 215);

        const name = profile.name.length >= 35 ? profile.name.slice(0, 35) + "..." : profile.name;
        const displayName = profile.displayName.length >= 26 ? profile.displayName.slice(0, 26) + "..." : profile.displayName;

        baseImg.print(font32, 20, 22.5, `@${name}`);
        baseImg.composite(avatar, 5, 80);

        const status = profile.status.toLowerCase() === "playing" ? "In Game" : profile.status;
        const createdDate = new Date(profile.created).toLocaleDateString('vi-VN');
        baseImg.print(font16, 250, 125, `Name: ${displayName}`);
        baseImg.print(font16, 250, 160, `Created: ${createdDate}`);
        baseImg.print(font16, 250, 195, `Status: ${status}`);

        const blockWidth = 425;
        const blockHeight = 80;
        const friendImageSize = 80;
        const blockX = 635;
        let yOffset = 25;

        profile.friends.slice(0, 3).forEach((friend, i) => {
            const friendImg = friendImgs[i].resize(friendImageSize, friendImageSize);
            const bg = new Jimp(blockWidth, blockHeight, 0x333333ff);
            bg.composite(friendImg, 10, 0);

            const shortName = friend.name.length > 23 ? friend.name.slice(0, 23) + "..." : friend.name;
            const textHeight = Jimp.measureTextHeight(font16, shortName, blockWidth - 100);
            const y = Math.max((blockHeight - textHeight) / 2, 0);

            bg.print(font16, 100, y, shortName);
            baseImg.composite(bg, blockX, yOffset);
            yOffset += blockHeight + 3;
        });

        await baseImg.writeAsync(outputPath);
        console.log("Image generated successfully!");
    } catch (error) {
        console.error("Error creating profile image:", error);
    }
}

async function getUserInfoById(userId: number) {
    const res = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
    return res.data; 
}

async function getFullUserProfileById(userId: number) {
    try {
        const user = await getUserInfoById(userId);
        
        const [friends, fullBodyUrl, status] = await Promise.all([
            getFriends(user.id),
            getUserThumbnail(user.id, '720x720', 'Png'),
            getUserStatus(user.id)
        ]);

        return {
            id: user.id,
            username: user.name,
            displayName: user.displayName,
            created: user.created,
            fullBodyUrl, 
            friends,
            status: status.status
        };
        
    } catch (error) {
        console.error(error);        
    }
}


export default {
    info: {
      name: "roblox",
      description: "Lấy profile roblox",
      version: "1.0.0",
      prefix: true,
      credits: "NPK31",
      usage: "roblox <tên>",
      category: ["Fun", "Info"],
      freeUse: true
    },
  
    execute: async ({ api, message, manager, parsedMessage, cprompt}) => {
      try {
        const username = parsedMessage.args.slice(1).join(" ");
        if (!username) return api.sendMessage("❗ Bạn cần nhập username Roblox!", message.threadID);
  
        const { onCooldown, remaining } = manager.cooldowns.isOnCooldown("roblox:command", "roblox");
        if (onCooldown) return api.sendMessage(`Còn ${Math.ceil(remaining / 1000)}s`, message.threadID);
  
        const users = await searchUsers(username);
        if (!users || Object.keys(users).length === 0)
          return api.sendMessage("❌ Không tìm thấy user nào.", message.threadID);
  
        const nameIdPairs = Object.entries(users);
        const [names, ids] = [
          nameIdPairs.map(([name]) => name),
          nameIdPairs.map(([, id]) => id),
        ];
  
        if (names.length === 1) {
          const id = ids[0];
          if (typeof id !== 'number' || id <= 0)
            return api.sendMessage("❗ Không lấy được ID hợp lệ.", message.threadID);
  
          const userInfo = await getFullUserProfileById(Number(id));
          if (!userInfo) return api.sendMessage("❌ Không lấy được thông tin user.", message.threadID);
  
          const output = path.join(manager.publicPath, "dist", "roblox_profile.png");
  
          manager.cooldowns.setCooldown("roblox:command", "roblox", 25000);
  
          await createImage({
            name: userInfo.username,
            displayName: userInfo.displayName,
            modelImage: Array.isArray(userInfo.fullBodyUrl) ? userInfo.fullBodyUrl[0] : userInfo.fullBodyUrl,
            status: userInfo.status,
            created: userInfo.created,
            friends: userInfo.friends
          }, manager.publicPath, output);
  
          return api.sendMessage({
            body: "",
            attachment: [fs.createReadStream(output)]
          }, message.threadID);
        }
  
        const options = names.map((name, idx) => `${idx}. ${name}`).join("\n➠ ");
        api.sendMessage({ body: `Bạn hãy nhập STT để xem profile:\n➠ ${options}`, avoid: { obfuscate: false } }, message.threadID);
  
        cprompt.create(message.senderID, async (reply) => {
          try {
            const body = parseInt(reply.body.trim());
            if (isNaN(body) || body < 0 || body >= names.length)
              return api.sendMessage("❗ STT không hợp lệ.", message.threadID);
  
            const id = ids[body];
            if (typeof id !== 'number' || id <= 0)
              return api.sendMessage("❗ Không lấy được ID hợp lệ.", message.threadID);
  
            const userInfo = await getFullUserProfileById(Number(id));
            if (!userInfo) return api.sendMessage("❌ Không lấy được thông tin user.", message.threadID);
  
            const output = path.join(manager.publicPath, "dist", "roblox_profile.png");
  
            manager.cooldowns.setCooldown("roblox:command", "roblox", 25000);
  
            await createImage({
              name: userInfo.username,
              displayName: userInfo.displayName,
              modelImage: Array.isArray(userInfo.fullBodyUrl) ? userInfo.fullBodyUrl[0] : userInfo.fullBodyUrl,
              status: userInfo.status,
              created: userInfo.created,
              friends: userInfo.friends
            }, manager.publicPath, output);
  
            api.sendMessage({
              body: "",
              attachment: [fs.createReadStream(output)]
            }, message.threadID);
  
          } catch (err) {
            console.error("❌ Error in cprompt handler:", err);
            api.sendMessage("🚨 Có lỗi xảy ra khi xử lý profile Roblox!", message.threadID);
          }
        }, 60000);
  
      } catch (err) {
        console.error("❌ Error in roblox command:", err);
        api.sendMessage("🚨 Đã xảy ra lỗi khi thực hiện lệnh Roblox!", message.threadID);
      }
    },
} satisfies import("../types").BotCommand;
  