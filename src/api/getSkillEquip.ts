import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type R = "N" | "R" | "SR" | "SSR";
type SKILL_NUMBER = "skillS1" | "skillS2" | "skillS3" | "skillS4" | "skillS5";

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
    SID: number;
}

interface Skills {
    skillS1?: Skill | null;
    skillS2?: Skill | null;
    skillS3?: Skill | null;
    skillS4?: Skill | null;
    skillS5?: Skill | null;
}

const skill_list: SKILL_NUMBER[] = ["skillS1", "skillS2", "skillS3", "skillS4", "skillS5"];

export async function getSkillEquip(id: string): Promise<Skills | null> {
    try {
        if (!id) {
            console.error("❌ Missing ID in getSkillEquip");
            return null;
        }

        const selectFields = Object.fromEntries(skill_list.map(skill => [skill, true]));

        const data = await prisma.skillSlot.findFirst({
            where: { userId: id },
            select: selectFields,
        });

        if (!data) {
            console.warn(`⚠️ No skill slot found for ID: ${id}`);
            return null;
        }

        // Lọc bỏ những slot null (nếu cần)
        const filteredData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== null)
        );

        return filteredData as Skills;
    } catch (error) {
        console.error("🚨 Error getting skill equip:", error);
        return null;
    }
}
