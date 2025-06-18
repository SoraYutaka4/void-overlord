import { PrismaClient } from "@prisma/client";
import { FindUserID } from "./findUserID";

const currentTime = new Date();
const prisma = new PrismaClient();

export async function CreateUser(id: string, name: string, firstName: string) {
    try {
        const user = await FindUserID(id);

        if (user) {
            console.log("User already exists.");
            return;
        }

        const newUser = await prisma.user.create({
            data: {
                id,
                name,
                firstName,
                DT_Daily: JSON.stringify({
                    M: currentTime.getMonth() + 1,
                    d: currentTime.getDate(),
                    h: currentTime.getHours(),
                    m: currentTime.getMinutes(),
                    s: currentTime.getSeconds()
                }),
                DT_Command: JSON.stringify({
                    M: currentTime.getMonth() + 1,
                    d: currentTime.getDate(),
                    h: currentTime.getHours(),
                    m: currentTime.getMinutes(),
                    s: currentTime.getSeconds()
                }),
                DT_Fight: JSON.stringify({
                    M: currentTime.getMonth() + 1,
                    d: currentTime.getDate(),
                    h: currentTime.getHours(),
                    m: currentTime.getMinutes(),
                    s: currentTime.getSeconds()
                }),   
                powers: {
                    create: {
                        attack: 0,
                        defense: 0,
                    }
                },
                bagSkills: {
                    create: {}
                },
                skillSlots: {
                    create: {
                        skillS1: { create: {  } }, 
                        skillS2: { create: {  } },
                        skillS3: { create: {  } },
                        skillS4: { create: {  } },
                        skillS5: { create: {  } }
                    }
                },
                defeated_lost: 0
            },
            include: {
                bagSkills: true,
                skillSlots: {
                    include: {
                        skillS1: true,
                        skillS2: true,
                        skillS3: true,
                        skillS4: true,
                        skillS5: true
                    }
                }
            }
        });
        
        

        if (!newUser) {
            console.error("Tạo tài khoản thất bại!");
            return;
        }

        return newUser;

    } catch (error) {
        console.error("Error creating user:", error);
    } finally {
        await prisma.$disconnect();
    }
}
