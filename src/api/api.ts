import {
     FindUserID, FindUserName, CreateUser, BagSkillHandle, DeleteUser, Transaction,
     CreateUserInfoBar, Wallet
    } 
from "./userHandlers";

import { EditDT, EditUser } from "./editUserHandlers";
import 
    {
    CreateBagSkillPowerImg, createDashboardPowerImage, createSkillPowerImage, 
    EditSkillSlot, CreateSkillRandomPowerImg, RandomSkill, GetPageSkill, addSkillInBag,
    getSkillEquip, updatePower, DeleteItemBag
    } 
from "./powerHandlers";

import {ChatCompletion, answer as conversation} from "./ai";
import { musicHandle, fetchLyricsGenius, geniusSearch } from "./musicHandle";
import { weather } from "./weather";
import { CreateWeatherImage } from "./createWeatherImg";
import createMoneyLeaderboard from "./createMoneyLeaderboard";

import { Router, Response, Request, NextFunction } from "express";
import path from "path";
import axios from "axios";
import JSONbig from 'json-bigint';
import { pathToFileURL } from "url";
import levenshtein from 'fast-levenshtein';

const JSONbigInstance = JSONbig({ storeAsString: true });
const router = Router();

async function reloadModule(currentDir: string, nameFile: string) {
    const filePath = path.join(currentDir, `${nameFile}.ts`);
    const moduleUrl = pathToFileURL(filePath).href;

    const moduleKey = Object.keys(require.cache).find((key) => key.includes(filePath));
    if (moduleKey) {
        delete require.cache[moduleKey];
        console.log(`🧹 Cache cleared for ${nameFile}`);
    }

    return await import(`${moduleUrl}?update=${Date.now()}`);
}

process.on('unhandledRejection', (reason, promise) => {
    console.error("❌ Unhandled promise rejection:", reason);
});

router.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`🚀 API request: ${req.method} ${req.url}`);
    next();
});


router.get("/name", async (req: Request, res: Response) => {
    try {
        const query = req.query;
        const name = query.name?.toString();
        const normal = query.normal?.toString();
        
        if (!name) return res.sendStatus(404);
        
        const user = await FindUserName(name);
        
        if (!user) {
            return res.sendStatus(404)
        }
        
        return normal 
            ? res.json(JSONbigInstance.parse(JSONbigInstance.stringify(user)))  
            : res.json(JSONbigInstance.parse(JSONbigInstance.stringify(user))); 
        
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.sendStatus(500);
    }
});

router.route("/")
  .get(async (req: Request, res: Response) => {
    try {
      const { id, normal } = req.query;

      if (!id) {
        return res.status(400).json({ error: "Missing id parameter" });
      }

      const user = await FindUserID(id.toString());

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json(normal ? JSONbigInstance.parse(JSONbigInstance.stringify(user)) : JSONbigInstance.stringify(user));

    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  })
  .post(async (req: Request, res: Response) => {
    try {
      const { id, name, firstName } = req.body;

      if (!id || !name || !firstName) {
        return res.status(400).json({ error: "Invalid id, name, or firstName" });
      }

      const user = await CreateUser(id, name, firstName);

      if (!user) {
        return res.status(500).json({ error: "Failed to create user" });
      }

      return res.status(201).json(JSONbigInstance.stringify(user));  

    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  })
  .patch(async (req: Request, res: Response) => {
    try {
      const { id, method, value, overwrite } = req.body;
      const numericValue = Number(value);  

      if (!id || !method) {
        return res.status(400).json({ error: "Missing id or method" });
      }

      if (isNaN(numericValue) && value !== undefined) {
        return res.status(400).json({ error: "Invalid numeric value" });
      }

      let updateResult: boolean | undefined;

      if (["balance", "exp", "level"].includes(method)) {
        const editResult = await EditUser(id, method, numericValue, !!overwrite);
        updateResult = editResult !== undefined;
      } else if (["DT_Daily", "DT_Command", "DT_Fight"].includes(method)) {
        updateResult = (await EditDT(id, method)) !== undefined;
      } else {
        return res.status(400).json({ error: "Invalid method" });
      }

      return updateResult !== undefined
        ? res.sendStatus(200)
        : res.status(400).json({ error: "Failed to update user" });

    } catch (error) {
      console.error("Error editing user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  })
  .delete(async (req: Request, res: Response) => {
    try {
      const id = req.query.id?.toString();

      if (!id) {
        return res.status(400).json({ error: "Invalid parameter" });
      }

      const del = await DeleteUser(id);

      if (!del) {
        return res.status(404).json({ error: "User not found or already deleted" });
      }

      return res.sendStatus(200);  

    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

router.get("/account/create", (req: Request, res: Response) => {
    return res.sendFile(path.join(__dirname, "..", "..", "public", "createAcc.html"));
});

router.get("/account/get", (req: Request, res: Response) => {
    return res.sendFile(path.join(__dirname, "..", "..", "public", "getAcc.html"));
});

let tracks: any[] = [null];

router.route("/tracks")
.get((req: Request, res: Response) => {
    if (!tracks) return res.status(500).json({ error: "Unable to load playlist" });

    const id = Number(req.query.id);
    if (!isNaN(id) && id >= 0 && id < tracks.length) {
        return res.status(200).json(tracks[id - 1]);
    } else if (!isNaN(id)) {
        return res.status(404).json({ error: "Invalid Id" });
    }
    
    return res.status(200).json(tracks);
})
.put((req: Request, res: Response) => {
    tracks = req.body;
    return res.sendStatus(200);
});

function getTrackById(id: number) {
    if (isNaN(id) || id < 1 || id > tracks.length) return null;
    return tracks[id - 1];
}

router.route("/music")
    .get(async (req: Request, res: Response) => {
        const search = req.query.search?.toString();
        const img = req.query.img?.toString();

        if (!search) return res.status(400).json({ error: "Missing search parameter" });

        const success = await musicHandle(search);

        if (!success) return res.status(500).json({ error: "Failed to handle music search" });

        return img
            ? res.sendFile(path.join(__dirname, "..", "public", "music", "musicList.png"))
            : res.sendStatus(200);
    });

router.route("/music/select/info")
    .get((req: Request, res: Response) => {
        const id = Number(req.query.id);
        const track = getTrackById(id);

        if (!track) return res.status(404).json({ error: "Invalid Id" });

        return res.json({
            id: track.id,
            name: track.name,
            preview_url: track.preview_url,
            album_img_url: track.album_img_url,
            artists: track.artists
        });
    });

router.route("/music/select/audio")
    .get(async (req: Request, res: Response) => {
        const id = Number(req.query.id);
        const track = getTrackById(id);

        if (!track) return res.status(404).json({ error: "Invalid Id" });

        try {
            const { data: audioStream } = await axios.get(track.preview_url, { responseType: "stream" });

            res.setHeader("Content-Type", "audio/mpeg");
            res.setHeader("Transfer-Encoding", "chunked");

            audioStream.pipe(res);
        } catch (error) {
            console.error("❌ Error streaming music:", error);
            return res.status(500).json({ error: "Failed to stream music" });
        }
    });

router.route("/music/select/lyrics")
    .get(async (req: Request, res: Response) => {
        const id = Number(req.query.id);

        const track = getTrackById(id);
        if (!track) return res.status(404).json({ error: "Invalid Id" });

        const artistList = (track.artists as string).split(",").map(artist => artist.trim());
        const artist = artistList.slice(0, 1).join(" & ");
        const cleanName = track.name.replace(/\s*\(.*?\)\s*/g, "").trim();
        
        const search = `${cleanName} ${artist}`;
        const genius = await geniusSearch(search);
        
        if (!genius) return res.status(400).json({ error: "Invalid API key" });

        const threshold = 10;
        
        const songResult = genius.find((hit: any) => {
            if (hit.type !== "song") return false;
        
            const distance = levenshtein.get(
                hit.result.title.toLowerCase(),
                cleanName.toLowerCase()
            );
        
            return distance <= threshold;
        });
        
        if (!songResult || !songResult.result.url) {
            return res.status(404).json({ error: "No lyrics found for a song" });
        }

        try {
            const lyrics = await fetchLyricsGenius(songResult.result.url);

            if (typeof lyrics !== "string") {
                return res.status(lyrics.code || 500).json({ error: lyrics.message || "Unknown error" });
            }

            return res.json({ lyrics });
        } catch (error) {
            console.error("❌ Error fetching lyrics:", error);
            return res.status(500).json({ error: "Failed to fetch lyrics" });
        }
    });

router.get("/ai", async (req: Request, res: Response) => {
    const q = req.query.q?.toString();
    const history = Boolean(req.query.history?.toString());
    const ui = Boolean(req.query.ui?.toString());

    if (history) {
        if (!ui) return res.json({ history: conversation });

        const html = conversation.map((msg) => {
            const color = msg.role === "user" ? "#61dafb" : "#22e69c";
            const prefix = msg.role === "user" ? "👤" : "🤖";
            const formatted = (msg.content as string)
                .replace(/\n/g, "<br/>")
                .replace(/```([\s\S]+?)```/g, "<pre style='background:#222;padding:10px;border-radius:5px;'><code>$1</code></pre>")
                .replace(/`([^`]+)`/g, "<code style='background:#333;padding:2px 5px;border-radius:3px;'>$1</code>")
                .replace(/\*\*(.*?)\*\*/g, "<mark style='background: cyan; color: gray;'>$1</mark>")
                .replace(/\*(.*?)\*/g, "<i>$1</i>")
                .replace(/~~(.*?)~~/g, "<s>$1</s>")
                .replace(/__(.*?)__/g, "<u>$1</u>");

            return `<div style="margin: 10px 0; padding: 10px; border-radius: 8px; background: #2b2b2b; color: ${color};">
                <b>${prefix}</b> ${formatted}
            </div>`;
        }).join("");

        return res.send(`
            <div style="font-family: 'Segoe UI', sans-serif; background-color: #121212; padding: 20px; border-radius: 10px;">
                <h2 style="color: #ffffff;">📜 Lịch sử chat với AI</h2>
                ${html}
            </div>
        `);
    }

    if (!q) return res.sendStatus(404);

    const message = decodeURIComponent(q);
    if (!message || typeof message !== "string") return res.sendStatus(404);

    const answer = await ChatCompletion(message);

    if (!ui) return res.send(answer);

    const formatted = answer
        .replace(/\n/g, "<br/>")
        .replace(/```([\s\S]+?)```/g, "<pre style='background: #222; padding: 10px; border-radius: 5px;'><code>$1</code></pre>")
        .replace(/`([^`]+)`/g, "<code style='background: #333; padding: 2px 5px; border-radius: 3px;'>$1</code>")
        .replace(/\*\*(.*?)\*\*/g, "<mark style='background: cyan; color: gray;'>$1</mark>")
        .replace(/\*(.*?)\*/g, "<i>$1</i>")
        .replace(/~~(.*?)~~/g, "<s>$1</s>")
        .replace(/__(.*?)__/g, "<u>$1</u>");

    return res.send(`
        <div style="font-family: 'Segoe UI', sans-serif; background-color: #121212; padding: 20px; border-radius: 10px;">
            <h2 style="color: #ffffff;">🤖 Kết quả từ AI</h2>
            <div style="margin-top: 10px; padding: 10px; border-radius: 8px; background: #2b2b2b; color: #22e69c;">
                ${formatted}
            </div>
        </div>
    `);
});



router.get("/weather", async (req: Request, res: Response) => {
    const id = Number(req.query.id);
    
    if (isNaN(id)) return res.sendStatus(404);

    const info = await weather(id);

    if (!info) return res.status(404);

    return res.json(info);
});

router.get("/weather/img", async (req: Request, res: Response) => {
    const id = Number(req.query?.id?.toString());
    const img = req.query.img?.toString();

    const body = await axios.get(`http://localhost:8000/api/weather?id=${id}`, { timeout: 5000 });

    if (body.status === 404) return res.sendStatus(404);

    const data = body.data;
    const location = data.location;
    const current = data.current;

    const {name, country} = location;
    const {time, is_day, temp_c, condition, feelslike_c, uv, gust_kph, aqi, aqi_status, cloud, humidity, uv_status} = current;
    const {text, code} = condition;

    await CreateWeatherImage(time, is_day, temp_c, feelslike_c, uv, gust_kph, aqi, aqi_status, cloud, humidity, name, country, text, code, uv_status);
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    return Boolean (img) ? 
    res.sendFile(path.join(__dirname, "..", "public", "weather", "w.png")): 
    res.sendStatus(200);
});

router.get("/power/editEquip", (req: Request, res: Response) => {
    return res.sendFile(path.join(__dirname, "..", "..", "public", "editEquip.html"))
});

router.get("/editUser", (req: Request, res: Response) => {
    return res.sendFile(path.join(__dirname, "..", "..", "public", "editUser.html"))
});

router.route("/power/bag/handle")
.get(async (req: Request, res: Response) => {
    const id = req.query.id?.toString();
    const check = req.query.check === "true";  
    const fulldata = req.query.fullData === "true";
    const type = req.query.type?.toString();

    if (!id) {
        return res.status(400).json({ error: "Invalid parameter" });
    }

    type M = "fight" | "defense" | "special";
    const validTypes: M[] = ["fight", "defense", "special"];

    if (type && !validTypes.includes(type as M)) {
        return res.status(400).json({ error: "Invalid type. Must be 'fight', 'defense', or 'special'." });
    }
    
    try {
        const bag = await BagSkillHandle(id, check, fulldata, type as M | undefined);
        if (bag === undefined) return res.sendStatus(400);
        if (typeof bag === "number") return res.json({ length: bag });
        if (typeof bag === "boolean") return res.json({ full: bag });
        if (Array.isArray(bag)) return res.json(bag);
    }
    catch (error) {
        console.error("Error:", error);
        return res.sendStatus(500);
    }
})

.delete(async (req: Request, res: Response) => {
    const id = req.query.id?.toString();
    const index = Number(req.query.i);
    const type = req.query.type?.toString();

    type M = "fight" | "defense" | "special";
    const validTypes: M[] = ["fight", "defense", "special"];

    if (!id || isNaN(index)) {  
        return res.status(400).json({ message: "Invalid parameter" });
    }

    if (!type || !validTypes.includes(type as M)) { 
        return res.status(400).json({ error: "Invalid type. Must be 'fight', 'defense', or 'special'." });
    }

    try {
        const new_data = await DeleteItemBag(id, index, type as M);

        if (!new_data) return res.status(400).json({ error: "User or bag skill not found" });
        if (new_data === 111) return res.status(400).json({ error: "Invalid type" });
        if (new_data === 112) return res.status(400).json({ error: `Index not found` });

        return res.sendStatus(200);
    } catch (error) {
        console.error("Error:", error);
        return res.sendStatus(500);
    }
});


router.get("/power/dashboard", async (req: Request, res: Response) => {
    const id = req.query.id?.toString();
    const avtEncode = req.query.avt?.toString();
    const img = Boolean(req.query.img);

    if (!id || !avtEncode) {
        return res.status(400).json({ error: "Missing 'id' or 'avt' parameter" });
    }

    const avt = decodeURIComponent(avtEncode);

    try {
        const res1 = await axios.get(`http://localhost:8000/api/power?id=${id}`);

        if (res1.status !== 200) {
            console.error("❌ Error fetching data from /api/power");
            return res.status(res1.status).json({ error: "Failed to retrieve power data" });
        }

        const res2 = await axios.get(`http://localhost:8000/api?id=${id}&normal=true`);

        if (res2.status !== 200) {
            console.error("❌ Error fetching data from /api");
            return res.status(res2.status).json({ error: "Failed to retrieve user data" });
        }

        let data;
        try {
            data = typeof res2.data === "string" ? JSONbig.parse(res2.data) : res2.data;
        } catch (parseError) {
            console.error("❌ JSON parsing error:", parseError);
            return res.status(500).json({ error: "Failed to parse JSON from API response" });
        }

        await createDashboardPowerImage.start(data, avt);

        console.log("✅ Dashboard Power Image created successfully");
         
        return img ? 
        res.sendFile(path.resolve(createDashboardPowerImage.save_location))
        : res.sendStatus(200);

    } catch (error) {
        console.error("❌ An error occurred while fetching data:", error);
        return res.status(500).json({ error: "Server error while creating dashboard" });
    }
});

router.post("/power/skillbag", async (req: Request, res: Response) => {
    const {idSkill, id, rank, method } = req.body;
    const arr_method = ["fight", "defense", "special"];

    if (!idSkill || !id || !rank|| !method) return res.status(400).json({ error: "Missing required fields" });

    if (!arr_method.includes(method)) return res.status(400).json({ error: "Invalid method" });

    try {
        const new_bag = await addSkillInBag(id, Number(idSkill), rank, method);

        if (!new_bag) {
            return res.status(400).json({ error: "Failed to add skill to bag" });
        }

        return res.status(200).json({ message: "Skill added to bag successfully" });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


router.get("/power/getpageskill", async (req: Request, res: Response) => {
    const { page, id, type } = req.query;

    if (!page || !id || isNaN(Number(page))) {
        return res.status(400).json({ error: "Invalid or missing required fields" });
    }

    type M = "fight" | "defense" | "special";
    const validTypes: M[] = ["fight", "defense", "special"];

    if (type && !validTypes.includes(type as M)) {
        return res.status(400).json({ error: "Invalid type. Must be 'fight', 'defense', or 'special'." });
    }

    try {
        const skills = await GetPageSkill(id.toString(), Number(page), type as M);

        if (!skills) {
            return res.status(404).json({ error: "User not found." });
        }

        return res.status(200).json(skills);
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});



router.get("/power/bag", async (req: Request, res: Response) => {
    const { id, avt, page, img, type } = req.query;

    if (!id || !avt || !page) {
        return res.status(400).json({ error: "Invalid or missing required fields" });
    }

    type M = "fight" | "defense" | "special";
    const validTypes: M[] = ["fight", "defense", "special"];

    if (type && !validTypes.includes(type as M)) {
        return res.status(400).json({ error: "Invalid type. Must be 'fight', 'defense', or 'special'." });
    }

    try {
        const user = await axios.get(`http://localhost:8000/api?id=${id}&normal=true`);
        const data = user.data;

        if (user.status !== 200) {
            return res.sendStatus(400);
        }

        const generated = await CreateBagSkillPowerImg.start(data, avt.toString(), Number(page), <M | null>type);

        if (!generated) return res.sendStatus(400);

        return Boolean(img) ? 
        res.sendFile(path.resolve(CreateBagSkillPowerImg.save_location))
        : res.sendStatus(200);
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


router.get("/power/random", async (req: Request, res: Response) => {
    const { id, rank, probability, method, percent } = req.query;

    if (!id || !rank || (!method && percent) || (method && !percent)) {
        return res.status(400).json({ error: "Invalid or missing required fields" });
    }

    if (method && !["fight", "defense", "special"].includes(method as string)) {
        return res.status(400).json({ error: "Invalid method parameter" });
    }

    type MT = "fight" | "defense" | "special";

    const pbb = typeof probability === "string" ? probability.split("-").map(Number) : [];

    const adjust = {
        method: method ? <MT>method : null,
        percent: percent !== undefined && percent !== "" ? Number(percent) : null
    };

    try {
        const skill = await RandomSkill(rank.toString(), id.toString(), pbb, adjust);

        if (skill === 111) return res.status(400).json({ id: skill, error: "User or rank is invalid" });
        if (skill === 112) return res.status(400).json({ id: skill, error: "Not enough balance" });
        if (skill === 113) return res.status(400).json({ id: skill, error: "Failed to update user balance" });
        if (skill === 114) return res.status(400).json({ id: skill, error: "Failed to save skill for user" });

        if (!skill) return res.status(400).json({ error: "Failed to create random skill" });

        return res.json(skill);
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});



router.get("/power/skill", async (req: Request, res: Response) => {
    const { idSkill, rank, avt, method, img } = req.query;

    if (!idSkill || !rank || !avt || !method) {
        return res.status(400).json({ error: "Invalid or missing required fields" });
    }

    if (method && !["fight", "defense", "special"].includes(method as string)) {
        return res.status(400).json({ error: "Invalid method parameter" });
    }

    type MT = "fight" | "defense" | "special";

    try {
        const skill = await createSkillPowerImage.start(idSkill.toString(), decodeURIComponent(avt.toString()), rank.toString(), <MT>method);

        if (!skill) return res.sendStatus(400);

        return Boolean (img) ? 
        res.sendFile(path.resolve(createSkillPowerImage.save_location))
        : res.sendStatus(200);

    } catch (error) {
        console.log(error);
    }
});


router.get("/power/random/image", async (req: Request, res: Response) => {
    const { id, rank, avt, img, probability, method, percent } = req.query;

    if (!id || !rank || !avt || (!method && percent) || (method && !percent)) {
        return res.status(400).json({ error: "Invalid or missing required fields" });
    }

    if (method && !["fight", "defense", "special"].includes(method as string)) {
        return res.status(400).json({ error: "Invalid method parameter" });
    }

    type MT = "fight" | "defense" | "special";

    const pbb = typeof probability === "string" ? probability : null

    const adjust = {
        method: method ? <MT>method : null,
        percent: percent && percent !== "" ? Number(percent) : null
    };

    try {
        const user = await axios.get(`http://localhost:8000/api?id=${id}&normal=true`);
        const data = user.data;

        if (user.status !== 200) {
            return res.status(400).json({ error: "User not found" });
        }

        const skill = await CreateSkillRandomPowerImg.start(
            data, 
            decodeURIComponent(avt.toString()), 
            rank.toString().toUpperCase(), 
            pbb,
            adjust
        );

        if (skill === 111) return res.status(400).json({ id: skill, error: "User or rank is invalid" });
        if (skill === 112) return res.status(400).json({ id: skill, error: "Not enough balance" });
        if (skill === 101) return res.status(400).json({ id: skill, error: "Not enough balance" });
        if (skill === 102) return res.status(400).json({ id: skill, error: "Not enough balance" });
        if (!skill) return res.status(400).json({ error: "Failed to create random skill" });

        if (Boolean(img)) {
            return res.sendFile(CreateSkillRandomPowerImg.save_location);
        }

        return res.sendStatus(200);
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});



router.route("/power/equip")
.get(async (req: Request, res: Response) => {
    const { id } = req.query;

    if (!id){
        return res.status(400).json({ error: "Invalid or missing required fields" });
    }

    try {
        const data = await getSkillEquip(id.toString());

        if (!data) return res.sendStatus(404);

        return res.status(200).json(data);

    } catch (error) {
        console.error('Error getting skill equiped:', error);
        return res.status(500).json({ error: "An error occurred while getting the skill equiped" });
    }
})
.patch(async (req: Request, res: Response) => {
    let { page, index, id, slot, type } = req.body;

    if (
        typeof index !== "number" || isNaN(index) ||
        typeof id !== "string" || !id.trim() ||
        typeof page !== "number" || isNaN(page) ||
        typeof slot !== "number" || isNaN(slot) || slot < 1 || slot > 5 ||
        typeof type !== "string"
    ) {
        return res.status(400).json({ error: "Invalid or missing required fields" });
    }

    type = type.toLowerCase();

    type M = "fight" | "defense" | "special";
    const validTypes: M[] = ["fight", "defense", "special"];

    if (!validTypes.includes(type as M)) {
        return res.status(400).json({ error: "Invalid type. Must be 'fight', 'defense', or 'special'." });
    }

    const validSlots: Record<number, M> = {
        1: "fight",
        2: "fight",
        3: "defense",
        4: "defense",
        5: "special",
    };

    if (validSlots[slot] !== type) {
        return res.status(400).json({ error: "Slot and type do not match." });
    }

    try {
        // Gọi hàm cập nhật kỹ năng
        const update = await EditSkillSlot(id, index, page, slot, type as M);

        if (!update) {
            return res.status(500).json({ error: "Failed to update skill slot" });
        }

        return res.status(200).json({ message: "Skill slot updated successfully" });
    } catch (error) {
        console.error("Error updating skill slot:", error);
        return res.status(500).json({ error: "An error occurred while updating the skill slot" });
    }
});




router.get("/power", async (req: Request, res: Response) => {
    const id = req.query.id as string;

    if (!id) {
        return res.status(400).json({ error: "Missing required field: id" });
    }

    try {
        const userPower = await updatePower(id);

        if (!userPower) {
            console.error(`Failed to update power for user ID: ${id}`);
            return res.status(500).json({ error: "Failed to update power" });
        }

        return res.status(200).json({
            id,
            attack: userPower.attack,
            defense: userPower.defense,
        });

    } catch (error) {
        console.error("Error updating power:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/bank", async (req: Request, res: Response) => {
    const { img, id } = req.query;
    const suffix = req.query.suffix === "false" ? false : Boolean(req.query.suffix ?? true);

    if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing or invalid 'id' parameter" });
    }

    // const Wallet = (await reloadModule(__dirname, "createWallet")).default;

    try {
        const result = await Wallet.start(id, suffix);

        if (typeof result === "object" && "status" in result) {
            return res.status(400).json(result);
        }

        return img
            ? res.sendFile(Wallet.save_location)
            : res.sendStatus(200);

    } catch (error) {
        console.error("❌ Error in /bank route:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.route("/transaction")
    .get(async (req: Request, res: Response) => {
        return res.sendFile(path.join(__dirname, "..", "..", "public", "transaction.html"));
    })
    .post(async (req: Request, res: Response) => {
        const { img, id1, id2, value } = req.body;

        if (!id1 || !id2 || !value) {
            return res.status(400).json({ error: "Missing required parameters (id1, id2, value)" });
        }

        if (typeof id1 !== "string" || typeof id2 !== "string") {
            return res.status(400).json({ error: "'id1' and 'id2' must be strings" });
        }

        if (isNaN(Number(value)) || Number(value) <= 0) {
            return res.status(400).json({ error: "'value' must be a positive number" });
        }

        try {
            const result = await Transaction.start({ id1, id2, value });

            if (typeof result === "object" && "status" in result) {
                return res.status(400).json(result); 
            }

            return img
                ? res.sendFile(Transaction.save_location)
                : res.sendStatus(200);

        } catch (error) {
            console.error("❌ Transaction error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    });


router.get("/infoBar", async (req: Request, res: Response) => {
    try {
        const name = req.query.name?.toString();
        const avt = req.query.avt?.toString();
        const img = Boolean(req.query.img); 

        if (!name || !avt) {
            return res.status(400).json({ error: "Missing name or avatar URL" });
        }

        const result = await CreateUserInfoBar.start(name, decodeURI(avt));

        if (!result) {
            return res.status(400).json({ error: "Failed to create user info bar" });
        }

        if (img) {
            return res.sendFile(CreateUserInfoBar.save_location, (err) => {
                if (err) {
                    console.error("❌ Error sending file:", err);
                    res.status(500).json({ error: "Failed to send image" });
                }
            });
        }

        return res.sendStatus(200);
    } catch (error) {
        console.error("❌ Error in /infoBar:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/leaderboard/money", async (req: Request, res: Response) => {
    const { img, page } = req.query;

    const pageNumber = Number(page);
    const wantImage = img === "true"; 

    if (!page || isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({ status: 110, error: "Missing or invalid 'page' parameter." });
    }

    try {
        const result = await createMoneyLeaderboard.start(pageNumber);

        if ("status" in result) {
            return res.status(400).json(result);
        }

        if (wantImage) {
            return res.sendFile(createMoneyLeaderboard.saveLocation, (err) => {
                if (err) {
                    console.error("❌ Error sending leaderboard image:", err);
                    return res.status(500).json({ status: 113, error: "Failed to send image." });
                }
            });
        }

        return res.status(200).json({
            status: 200,
            message: "Leaderboard fetched successfully.",
            page: result.page,
            totalPages: result.totalPages,
            data: result.data,
            imagePath: result.imagePath,
        });
    } catch (error) {
        console.error("❌ Unexpected error:", error);
        return res.status(500).json({ status: 500, error: "Internal server error." });
    }
});

  

export default router;
