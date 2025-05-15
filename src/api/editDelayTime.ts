import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface DT{
    DT_Daily: string,
    DT_Command: string,
}

export async function EditDT(id:string, method: keyof DT) {
    try {
        console.log("")
        const user = await prisma.user.findUnique({
            where: {
                id
            }
        });
    
        if (!user) return;

        const currentTime = new Date();        

        if (method === "DT_Command"){

            const result = await prisma.user.update({
                where: {
                    id
                },
                data: {
                    [method]: JSON.stringify({
                        M: currentTime.getMonth() + 1,
                        d: currentTime.getDate(),
                        h: currentTime.getHours(),
                        m: currentTime.getMinutes(),
                        s: currentTime.getSeconds() + 10
                    }),
                }
            });

            return result;

        } else if (method === "DT_Daily"){

            const result = await prisma.user.update({
                where: {
                    id
                },
                data: {
                    [method]: JSON.stringify({
                        M: currentTime.getMonth() + 1,
                        d: currentTime.getDate(),
                        h: currentTime.getHours() + 1,
                        m: currentTime.getMinutes(),
                        s: currentTime.getSeconds()
                    }),
                }
            });

            return result;
        } else if (method === "DT_Fight"){
            const result = await prisma.user.update({
                where: {
                    id
                },
                data: {
                    [method]: JSON.stringify({
                        M: currentTime.getMonth() + 1,
                        d: currentTime.getDate(),
                        h: currentTime.getHours(),
                        m: currentTime.getMinutes(),
                        s: currentTime.getSeconds() + 5
                    }),
                }
            })

            return result;
        }
        
    } catch (error) {
        
    }

    
}