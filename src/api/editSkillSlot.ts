import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { updatePower } from "./updatePower";

const prisma = new PrismaClient();

type SKILL_NUMBER = "skillS1" | "skillS2" | "skillS3" | "skillS4" | "skillS5";
type M = "fight" | "defense" | "special";

interface Skill {
    id: string;
    imgUrl: string;
    attack?: number;
    defense?: number;
    level: number;
    rank: string;
    name: string;
    sign?: string;
    sign_attack?: string;
    sign_defense?: string;
    description: string;
    SID: number;
}

// 🛠️ Hàm lấy kỹ năng theo trang
async function fetchSkill(id: string, page: number, index: number, type: M): Promise<Skill | null> {
    try {
        const params = new URLSearchParams({ id, page: page.toString(), type });

        const response = await axios.get(`http://localhost:8000/api/power/getpageskill?${params.toString()}`, {
            timeout: 5000,
        });

        if (!response.data || !Array.isArray(response.data)) return null;

        return response.data.at(index - 1) || null;
    } catch (error) {
        console.error(`Error fetching skill (ID: ${index}, Page: ${page}):`, error);
        return null;
    }
}

// 🛠️ Hàm cập nhật kỹ năng vào slot
async function updateSkillSlot(id: string, skill: Skill, nameSlot: SKILL_NUMBER, skillIndex: number, type: M): Promise<boolean> {
    try {
        // 🔍 Lấy thông tin slot kỹ năng hiện tại
        const currentSkillInSlot = await prisma.skillSlot.findFirst({
            where: { userId: id },
            include: { [nameSlot]: true }
        });

        if (!currentSkillInSlot) {
            console.error("❌ Không tìm thấy slot kỹ năng!");
            return false;
        }

        const currentSkill = currentSkillInSlot[nameSlot] as Skill ?? null;
        const slotSkillId = `${nameSlot}Id`;

        // Xác định loại kỹ năng dựa vào slot
        const methodMap: Record<SKILL_NUMBER, M> = {
            skillS1: "fight", skillS2: "fight",
            skillS3: "defense", skillS4: "defense",
            skillS5: "special"
        };
        const method = methodMap[nameSlot];

        // 🛠️ Dữ liệu cập nhật kỹ năng
        const updateData: Partial<Skill> = {
            name: skill.name,
            imgUrl: skill.imgUrl,
            level: skill.level,
            rank: skill.rank,
            description: skill.description,
            SID: Number(skill.id)
        };

        if ("attack" in skill) updateData.attack = skill.attack;
        if ("defense" in skill) updateData.defense = skill.defense;
        if ("sign_attack" in skill && "sign_defense" in skill) {
            updateData.sign_attack = skill.sign_attack;
            updateData.sign_defense = skill.sign_defense;
        } else if ("sign" in skill) {
            updateData.sign = skill.sign;
        } else if (!("sign" in skill) || skill.sign?.trim() === "") {
            updateData.sign = "add";
        }

        // 🔍 Kiểm tra nếu `InfoSkillSpecial` đã tồn tại chưa
        let skillId: string = currentSkillInSlot[slotSkillId];

        if (!skillId) {
            console.log("❌ Không tìm thấy ID của skill cũ, tạo mới!");
            skillId = skill.id.toString();
        }

        let existingSkill = null;

        if (type === "fight") {
            existingSkill = await prisma.infoSkillFight.findUnique({ where: { id: skillId } });
        } else if (type === "defense") {
            existingSkill = await prisma.infoSkillDefense.findUnique({ where: { id: skillId } });
        } else if (type === "special") {
            existingSkill = await prisma.infoSkillSpecial.findUnique({ where: { id: skillId } });
        }

        if (!existingSkill) {
            console.log(`ℹ️ Không tìm thấy ${type}, tạo mới...`);
        
            if (type === "fight") {
                existingSkill = await prisma.infoSkillFight.create({ data: { id: skillId, ...updateData } });
            } else if (type === "defense") {
                existingSkill = await prisma.infoSkillDefense.create({ data: { id: skillId, ...updateData } });
            } else if (type === "special") {
                existingSkill = await prisma.infoSkillSpecial.create({ data: { id: skillId, ...updateData } });
            }

            if (existingSkill) {
                skillId = existingSkill.id;
            } else {
                throw new Error("Failed to create or find the skill.");
            }
        }

        // 🔄 Cập nhật slot kỹ năng
        const updateSlot = await prisma.skillSlot.update({
            where: { id: currentSkillInSlot.id.toString() },
            data: {
                [nameSlot]: {
                    update: updateData // Cập nhật toàn bộ dữ liệu của skill
                }
            }
        });

        console.log("✅ Updated slot", updateSlot);

        // 🗑️ Xóa skill cũ khỏi bag
        const params = new URLSearchParams({ id, type, i: skillIndex.toString() });

        console.log("🗑️ Đang xóa skill trong túi...");
        await axios.delete(`http://localhost:8000/api/power/bag/handle?${params.toString()}`, { timeout: 5000 });

        console.log("✅ New skill removed in bag");

        // 📦 Nếu có kỹ năng cũ, đưa vào túi sau khi cập nhật thành công
        if (currentSkill) {
            console.log("📦 Đưa kỹ năng cũ vào túi...");
            console.log(`${method} - ${id} - ${currentSkill.SID}`);
            try {
                await axios.post("http://localhost:8000/api/power/skillbag", {
                    id, idSkill: currentSkill.SID, rank: currentSkill.rank, method
                }, { timeout: 5000 });
                console.log("✅ Old skill added to bag!");

                updatePower(id);
            } catch (error) {
                
            }
        }

        console.log("✅ New skill removed in bag");

        return true;

    } catch (error) {
        console.error("❌ Error updating skill slot:", error);
        return false;
    }
}








// 🛠️ Hàm chỉnh sửa slot kỹ năng
export async function EditSkillSlot(id: string, index: number, page: number, slot: number, type: M): Promise<boolean> {
    try {
        if (!id || !index) return false;

        const skill = await fetchSkill(id, page, index, type);
        if (!skill?.id || !skill.rank || !(skill.attack || skill.defense)) return false;

        const skillIndex = (page - 1) * 3 + index - 1;
        console.log(skillIndex);

        const nameSlot: SKILL_NUMBER = `skillS${slot}` as SKILL_NUMBER;
        const update = await updateSkillSlot(id, skill, nameSlot, skillIndex, type);

        if (!update) return false;

        return true;
    } catch (error) {
        console.error("Error editing skill slot:", error);
        return false;
    }
}
