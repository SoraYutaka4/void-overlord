import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export interface APIKeyData {
    [key: string]: string[]; 
}
  
  
export const get_API_Key = (name: string): string[] => {
    const filePath = path.resolve(__dirname, "key.json");

    try {
        if (!fs.existsSync(filePath)) {
            const defaultData: APIKeyData = {};
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), "utf-8");
            console.log("api_key.json was created.");
            return [];
        }

        const json = fs.readFileSync(filePath, "utf-8");
        const data: APIKeyData = JSON.parse(json);

        if (name in data) {
            return data[name];
        } else if (process.env[name]){
            return process.env[name].split(",");
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error reading or parsing the API key file:", error);
        return [];
    }
};