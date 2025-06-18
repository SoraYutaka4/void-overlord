import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { quickSortByProperty } from "./quickSortByProperty";
import { quickSortByCombined } from "./quickSortBy2Property";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();
const pathSkills = path.resolve(__dirname, "../public/skills");

interface Skill {
    id: number;
    imgUrl: string;
    attack?: number;
    defense?: number;
    level: number;
    rank: string;
    name: string;
    sign: string;
    description: string;
}

export async function addSkillInBag(id: string, idSkill: number, rank: string, method: string) {
    if (!id || !rank || !idSkill || !method) {
        console.error("Invalid parameters");
        return;
    }

    try {
        // Tìm người dùng theo id
        const user = await prisma.bagSkill.findUnique({
            where: { userId: id },
        });

        if (!user) {
            console.error("User not found");
            return;
        }

        // Lấy URL dựa vào rank và method
        const apiUrl = getApiUrl(rank, method);
        if (!apiUrl) {
            console.error("Invalid rank or method");
            return;
        }

        // Gọi API để lấy dữ liệu kỹ năng
        let data;
        try {
            const response = await axios.get(apiUrl);
            if (response.status === 200) {
                data = response.data;
            } else {
                console.error("Failed to fetch data from API");
                return;
            }
        } catch (apiError) {
            console.error("Error fetching data from API:", apiError);
            return;
        }

        // Tìm kỹ năng trong dữ liệu
        const skill: Skill = data.find((obj: any) => obj.id === idSkill);
        if (!skill) {
            console.error("Skill not found in API data");
            return;
        }
        
        // Lấy mảng kỹ năng từ cơ sở dữ liệu
        const fieldToUpdate = method === "fight" ? "fight" : method === "defense" ? "defense" : "special";
        const currentSkills = JSON.parse(user[fieldToUpdate] || "[]");
        
        const p = `${pathSkills}/${method}/${method}_${rank}.png`;

        if (fs.existsSync(p)){
            skill.imgUrl = p;
        } else {
            console.error("Image not found:", p);
            return null;
        }
        
        // Thêm kỹ năng vào mảng
        currentSkills.push(skill);

        // Sắp xếp kỹ năng
        let skillsSorted;
        if (method === "fight") {
            skillsSorted = quickSortByProperty(currentSkills, "attack");
        } else if (method === "defense") {
            skillsSorted = quickSortByProperty(currentSkills, "defense");
        } else if (method === "special") {
            skillsSorted = quickSortByCombined(currentSkills, "attack", "defense");
        }

        if (!Array.isArray(skillsSorted)) return;

        // Đảo ngược mảng nếu cần
        skillsSorted.reverse();

        // Cập nhật lại dữ liệu vào cơ sở dữ liệu
        await prisma.bagSkill.update({
            where: { userId: id },
            data: { [fieldToUpdate]: JSON.stringify(skillsSorted) },
        });

        return skillsSorted;

    } catch (error) {
        console.error("Error processing request:", error);
    }
}

// Hàm để lấy URL API dựa trên rank và method
function getApiUrl(rank: string, method: string): string | null {
    const baseUrl = "https://raw.githubusercontent.com/npk31/weapon-bot-chat-/main/src/data";
    const rankPath = rank.toLowerCase();
    
    switch (method) {
        case "fight":
        case "defense":
        case "special":
            return `${baseUrl}/${rankPath}/${method}.json`;
        default:
            return null;
    }
}
