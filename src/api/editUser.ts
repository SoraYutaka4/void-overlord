import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type User = {
  level: number | bigint;
  exp: number | bigint;
  balance: number | bigint;
};

export async function EditUser(id: string, method: keyof User, value: number, overwrite: boolean = false) {
  if (!id || !method) {
    console.error("Invalid parameters");
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!user) {
      console.error("User not found");
      return;
    }

    if (!(method in user)) {
      console.error("Invalid method");
      return;
    }

    const currentValue = user[method];
    
    if (typeof currentValue === 'bigint') {
      let updatedValue = currentValue + BigInt(value);
      
      if (overwrite){
        updatedValue = BigInt(value);
      }
      const updatedUser = await prisma.user.update({
        where: { id: id },
        data: { [method]: updatedValue },
      });

      return updatedUser;
    } else if (typeof currentValue === 'number') {
      let updatedValue = currentValue + value; 
      
      if (overwrite){
        updatedValue = value;
      }

      const updatedUser = await prisma.user.update({
        where: { id: id },
        data: { [method]: updatedValue },
      });

      return updatedUser;
    } else {
      console.error("Field is not a number or BigInt");
      return;
    }

  } catch (error) {
    console.error("Error updating user:", error);
  }
}
