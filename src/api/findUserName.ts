import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function FindUserName(name: string){
    try {
        
        const users = await prisma.user.findFirst({
            where: {
                name
            },
            include: {
                powers: {
                    include: {

                    }
                },
                skillSlots: {
                    include: {
                        skillS1: {
                            include: {

                            }
                        },
                        skillS2: {
                            include: {
                                
                            }
                        },
                        skillS3: {
                            include: {
                                
                            }
                        },
                        skillS4: {
                            include: {
                                
                            }
                        },
                        skillS5: {
                            include: {
                                
                            }
                        }
                    }
                },
                bagSkills: {
                    include: {
                        
                    }
                }

            }
        });
    
        return users;      

    } catch (error) {
        console.error(error);
    }
}