import axios from "axios";
import Chance from "chance";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

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

type MT = "fight" | "defense" | "special";
type R = "N" | "R" | "SR" | "SSR";
type A = {
    method: string | null,
    percent: number | null
};


const pathSkills = path.resolve(__dirname, "../public/skills");
const arrayMethod = [
    { value: "fight", probability: 50 },
    { value: "defense", probability: 42.5 },
    { value: "special", probability: 7.5 }
];

const getRandomArray = (method: MT, percent: number): { value: MT; probability: number }[] | null => {
    if (percent < 0 || percent > 100) {
        console.error("Invalid percent value:", percent);
        return null;
    }

    const remain = (100 - percent) / 2;
    const newArr = [
        { value: "fight", probability: 0 },
        { value: "defense", probability: 0 },
        { value: "special", probability: 0 }
    ];

    newArr.forEach(item => {
        if (item.value === method) {
            item.probability = percent;
        } else {
            item.probability = remain;
        }
    });

    return newArr as { value: MT; probability: number }[];
};


const getRandomAdjustArray = (percent: number[]): { value: MT; probability: number }[] | null => {
    if (percent.length !== 3 || percent.some(p => p < 0)) {
        console.error("Invalid probability array:", percent);
        return null;
    }

    const total = percent.reduce((a, b) => a + b, 0);

    if (total > 100) {
        console.error("Total probability exceeds 100%:", total);
        return null;
    }

    return [
        { value: "fight", probability: percent[0] },
        { value: "defense", probability: percent[1] },
        { value: "special", probability: percent[2] }
    ];
};

const prisma = new PrismaClient();
const chance = new Chance();

const MAX_RETRY = 3; 

export async function RandomSkill(rank: string, id: string, probability: number[], adjust: A): Promise<undefined | number | null | Skill> {
    try {
        if (!isValidRank(rank)) {
            console.error("Invalid rank provided");
            return 111;
        }

        const user = await fetchUser(id);
        if (!user) return;

        const isValidProbability = Array.isArray(probability) &&
            probability.length === 3 &&
            probability.every(p => typeof p === "number" && p >= 0) &&
            probability.reduce((a, b) => a + b, 0) <= 100;

        const isValidAdjust = adjust.method &&
            typeof adjust.method === "string" &&
            adjust.percent !== null &&
            adjust.percent >= 0 &&
            adjust.percent <= 100;

        let decision = isValidProbability
            ? getRandomAdjustArray(probability)
            : isValidAdjust
                ? getRandomArray(<MT>adjust.method, adjust.percent!)
                : arrayMethod;

        if (!decision) {
            console.error("Invalid decision array, using default method.");
            decision = arrayMethod;
        }

        const method: MT = chance.weighted(
            decision.map(i => i.value),
            decision.map(i => i.probability)
        ) as MT;

        const randomUrl = getApiUrl(rank, method);
        if (!randomUrl) {
            console.error("Invalid API URL");
            return null;
        }

        const skillsData: Skill[] | null = await fetchSkills(randomUrl);
        if (!skillsData || skillsData.length === 0) {
            console.error("No skills available for selection");
            return null;
        }

        const selectedSkill = selectRandomSkill(skillsData, method, <R>rank.toUpperCase());
        if (!selectedSkill) {
            console.error("Failed to select a skill");
            return null;
        }

        const deductionAmount = calculateDeduction(rank);
        if (!deductionAmount || user.balance < deductionAmount) {
            console.error("Insufficient balance or invalid deduction amount");
            return 112;
        }

        const balanceUpdated = await updateUserBalance(id, deductionAmount);
        if (!balanceUpdated) {
            console.error("Failed to update user balance");
            return 113;
        }

        const skillSaved = await saveUserSkill(selectedSkill, id, rank, method);
        if (!skillSaved) {
            console.error("Failed to save skill for user");
            return 114;
        }

        return selectedSkill;

    } catch (error) {
        console.error("Error in RandomSkill:", error);
        return null;
    }
}


function isValidRank(rank: string): boolean {
    const validRanks = ["N", "R", "SR", "SSR"];
    return validRanks.includes(rank);
}

async function fetchUser(id: string) {
    try {
        const user = await axios.get(`http://localhost:8000/api?id=${id}&normal=true`);
        if (user.status !== 200 || !user.data) {
            console.error(`User fetch failed`);
            return null;
        }
        return user.data;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        return null;
    }
}

async function fetchSkills(url: string, retryCount = 0): Promise<any> {
    try {
        const response = await axios.get(url);
        if (response.status === 200) {
            return response.data;
        }
        console.error(`Failed to fetch skills, status: ${response.status}`);
        return null;
    } catch (error) {
        console.error(`Error fetching skills from ${url}:`, error);
        if (retryCount < MAX_RETRY) {
            console.log(`Retrying fetch skills... (${retryCount + 1}/${MAX_RETRY})`);
            return fetchSkills(url, retryCount + 1);
        }
        return null;
    }
}

function selectRandomSkill(data: Skill[], method: MT, rank: R): Skill | null {
    const randomIndex = Math.floor(Math.random() * data.length);
    const randomSkill: Skill = data[randomIndex];

    const p = `${pathSkills}/${method}/${method}_${rank.toLowerCase()}.png`;

    if (!fs.existsSync(p)) {
        console.error("Image not found:", p);
        return null;
    }

    randomSkill.imgUrl = p;
    return randomSkill;
}


function calculateDeduction(rank: string): number | null {
    switch (rank){
        case "N": return 100;
        case "R": return 10**4;
        case "SR": return 10**6;
        case "SSR": return 10**8;
        default: return null;
    }
}

async function updateUserBalance(id: string, amount: number): Promise<boolean> {
    try {
        const response = await axios.patch("http://localhost:8000/api", {
            method: "balance",
            id,
            value: -amount
        });
        return response.status === 200;
    } catch (error) {
        console.error("Error updating user balance:", error);
        return false;
    }
}

async function saveUserSkill(skill: any, id: string, rank: string, method: string): Promise<boolean> {
    console.log(skill);

    try {
        const saveResponse = await axios.post("http://localhost:8000/api/power/skillbag", {
            idSkill: skill?.id,  
            id,
            rank,
            method
        });
        return saveResponse.status === 200;
    } catch (error) {
        console.error("Error saving user skill:", error);
        return false;
    }
}

function getApiUrl(rank: string, method: string): string | null {
    const baseUrl = "https://raw.githubusercontent.com/npk31/weapon-bot-chat-/main/src/data";
    const rankPath = rank.toLowerCase();

    if (["fight", "defense", "special"].includes(method)) {
        return `${baseUrl}/${rankPath}/${method}.json`;
    }
    return null;
}
