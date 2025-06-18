import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
type M = "fight" | "defense" | "special";

export async function DeleteItemBag(id: string, index: number, type: M): Promise<boolean | number> {
    try {
        // Lấy dữ liệu trực tiếp từ database
        const bagSkill = await prisma.bagSkill.findUnique({ where: { userId: id } });

        if (!bagSkill) {
            console.error("BagSkill not found for user:", id);
            return false;
        }

        // Lấy dữ liệu theo type (fight, defense, special)
        const skillJson = bagSkill[type];

        if (!skillJson) {
            console.error("Skill data not found for type:", type);
            return 111;
        }

        // Parse JSON
        const data: any[] = JSON.parse(skillJson);

        if (!data[index]) return 112; // Kiểm tra index hợp lệ

        // Xóa item theo index
        const new_arr = data.filter((_, i) => i !== index);

        // Cập nhật lại database
        const update = await prisma.bagSkill.update({
            where: { userId: id },
            data: { [type]: JSON.stringify(new_arr) }
        });

        return update ? true : false;

    } catch (error) {
        console.error("Error in DeleteItemBag:", error);
        return false;
    }
}
