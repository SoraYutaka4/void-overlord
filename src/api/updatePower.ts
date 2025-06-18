import axios from "axios";
import { PrismaClient } from "@prisma/client";

interface Power{
    attack: number,
    defense: number, 
}

interface Skill {
    id: string;
    imgUrl: string;
    attack?: number;
    defense?: number;
    level: number;
    rank: string;
    name: string;
    sign: string;
    description: string;
    SID: number
}

interface Skills {
    skillS1: Skill,
    skillS2: Skill,
    skillS3: Skill,
    skillS4: Skill,
    skillS5: Skill,
}

const prisma = new PrismaClient();

async function updatePowerDB(id: string,  power: Power) {
    try {
        const update = await prisma.power.update({
            where: { userId: id },
            data: {
                attack: power.attack,
                defense: power.defense
            }
        });
    
        return update
        
    } catch (error) {
        console.log("Error updating power: ", error);
    }
}


export async function updatePower(id: string): Promise<Power | null> {
    if (!id) return null;

    try {
        const res = await axios.get(`http://localhost:8000/api/power/equip?id=${id}`);
        const skill_list: Skills = res.data;

        if (!skill_list) return null;

        let totalAttack = 0;
        let totalDefense = 0;

        for (const key in skill_list) {
            const skill = skill_list[key as keyof Skills];
            if (skill.attack) totalAttack += skill.attack;
            if (skill.defense) totalDefense += skill.defense;
        }

        const updatedPower: Power = { attack: totalAttack, defense: totalDefense };

        await updatePowerDB(id, updatedPower);

        return updatedPower;
    } catch (error) {
        console.error("Error updating power:", error);
        return null;
    }
}
