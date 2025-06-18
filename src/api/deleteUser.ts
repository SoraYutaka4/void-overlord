import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DeleteUser(id: string): Promise<boolean> {
    try {
        await prisma.$transaction(async (tx) => {
            const existingUser = await tx.user.findUnique({
                where: { id }
            });
            
            if (!existingUser) {
                console.log(`❌ User với ID ${id} không tồn tại.`);
                return false;
            }

            // Lấy tất cả ID của các SkillSlot liên quan đến User
            const skillSlots = await tx.skillSlot.findMany({
                where: { userId: id },
                select: {
                    skillS1Id: true,
                    skillS2Id: true,
                    skillS3Id: true,
                    skillS4Id: true,
                    skillS5Id: true,
                }
            });

            // Gộp tất cả ID thành một mảng duy nhất (loại bỏ giá trị null)
            const skillIds = skillSlots.flatMap(slot =>
                [slot.skillS1Id, slot.skillS2Id, slot.skillS3Id, slot.skillS4Id, slot.skillS5Id].filter((id): id is string => id !== null)
            );

            // Xóa tất cả skill liên quan (nếu có)
            if (skillIds.length > 0) {
                await tx.infoSkillFight.deleteMany({ where: { id: { in: skillIds } } });
                await tx.infoSkillDefense.deleteMany({ where: { id: { in: skillIds } } });
                await tx.infoSkillSpecial.deleteMany({ where: { id: { in: skillIds } } });
            }

            // Xóa SkillSlot của User
            await tx.skillSlot.deleteMany({ where: { userId: id } }); 

            // Xóa BagSkill của User
            await tx.bagSkill.deleteMany({ where: { userId: id } });

            // Xóa Power của User
            await tx.power.deleteMany({ where: { userId: id } });

            // Cuối cùng, xóa User
            await tx.user.delete({ where: { id } });
        });

        console.log(`✅ User ${id} deleted successfully.`);
        return true;
    } catch (error: any) {
        console.error(`❌ Error deleting user ${id}:`, error.message);
        return false;
    }
}
