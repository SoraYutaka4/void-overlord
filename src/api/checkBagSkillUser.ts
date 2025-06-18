import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const LIMIT_SLOT = 75;

type M = "fight" | "defense" | "special";

export async function BagSkillHandle(
  id: string,
  check: boolean = false,
  fullData: boolean = false,
  type: M | undefined
): Promise<number | boolean | any[] | undefined> {
  if (!id) {
    console.error("Invalid parameters: ID is required.");
    return;
  }

  if (type && !["fight", "defense", "special"].includes(type)) {
    console.error("Invalid type. Must be 'fight', 'defense', or 'special'.");
    return;
  }

  try {
    // Tìm người dùng
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      console.error("User not found");
      return;
    }

    // Tìm bagSkill của user
    const bagSkill = await prisma.bagSkill.findUnique({ where: { userId: id } });
    if (!bagSkill) {
      console.error("BagSkill not found");
      return;
    }

    // Parse JSON skill data
    const skills = {
      fight: JSON.parse(bagSkill.fight || "[]"),
      defense: JSON.parse(bagSkill.defense || "[]"),
      special: JSON.parse(bagSkill.special || "[]"),
    };

    const totalSkills = [...skills.fight, ...skills.defense, ...skills.special];

    // Kiểm tra số lượng skill
    if (check) return totalSkills.length >= LIMIT_SLOT;

    // Trả về full data nếu yêu cầu
    if (fullData) return totalSkills;

    // Trả về skill theo loại
    if (type) {
      return skills[type];
    }
    return totalSkills.length;

  } catch (error) {
    console.error("Error retrieving skills:", error);
    return undefined;
  }
}
