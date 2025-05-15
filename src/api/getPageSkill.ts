import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
type M = "fight" | "defense" | "special";


export async function GetPageSkill(id: string, page: number, type: M): Promise<any[] | undefined> {
    if (page < 1) {
        console.error("Invalid page number");
        return;
    }

    try {
        const bagSkill = await prisma.bagSkill.findUnique({
            where: {
userId: id
}
        });

        if (!bagSkill) {
            console.error("BagSkill not found");
            return;
        }

        const fightJson = bagSkill.fight;
        const defenseJson = bagSkill.defense;
        const specialJson = bagSkill.special;

        if (!fightJson || !defenseJson || !specialJson) {
            console.error("Incomplete skill data");
            return;
        }

        const fight: any[] = JSON.parse(fightJson) || [];
        const defense: any[] = JSON.parse(defenseJson) || [];
        const special: any[] = JSON.parse(specialJson) || [];

        const totalSkill = type ? 
        (type === "special") ?
        special :
        (type === "fight") ?
        fight : defense :
        special.concat(fight, defense);

        const itemsPerPage = 3;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        if (startIndex >= totalSkill.length) {
        console.error("Page number exceeds total pages");
            return [];
    }

        const skillOnPage = totalSkill.slice(startIndex, endIndex);

        // Nếu số lượng mục trên trang nhỏ hơn số lượng yêu cầu
        if (skillOnPage.length < itemsPerPage) {
            // Thêm các mục trống để đảm bảo số lượng trang cố định
            for (let i = skillOnPage.length; i < itemsPerPage; i++) {
                skillOnPage.push({
                    id: "",
                    name: "",
                    description: "",
                    level: 0,
                    rank: "",
                    imgUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Black_question_mark.png",
                    defense: "",
                    attack: "",
                    sign: ""
                });
            }
        }

        return skillOnPage;

    } catch (error) {
        console.error("Error:", error);
        return;
    }
}
