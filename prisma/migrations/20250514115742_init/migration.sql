-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "exp" INTEGER NOT NULL DEFAULT 0,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "DT_Daily" TEXT NOT NULL,
    "DT_Command" TEXT NOT NULL,
    "DT_Fight" TEXT NOT NULL,
    "defeated_lost" BIGINT NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Power" (
    "attack" BIGINT NOT NULL DEFAULT 0,
    "defense" BIGINT NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL PRIMARY KEY,
    CONSTRAINT "Power_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BagSkill" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "fight" TEXT NOT NULL DEFAULT '[]',
    "defense" TEXT NOT NULL DEFAULT '[]',
    "special" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "BagSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "skillS1Id" TEXT,
    "skillS2Id" TEXT,
    "skillS3Id" TEXT,
    "skillS4Id" TEXT,
    "skillS5Id" TEXT,
    CONSTRAINT "SkillSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkillSlot_skillS1Id_fkey" FOREIGN KEY ("skillS1Id") REFERENCES "InfoSkillFight" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkillSlot_skillS2Id_fkey" FOREIGN KEY ("skillS2Id") REFERENCES "InfoSkillFight" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkillSlot_skillS3Id_fkey" FOREIGN KEY ("skillS3Id") REFERENCES "InfoSkillDefense" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkillSlot_skillS4Id_fkey" FOREIGN KEY ("skillS4Id") REFERENCES "InfoSkillDefense" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkillSlot_skillS5Id_fkey" FOREIGN KEY ("skillS5Id") REFERENCES "InfoSkillSpecial" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InfoSkillFight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'Wooden Staff',
    "description" TEXT NOT NULL DEFAULT 'Một cây gậy gỗ đơn giản không có thuộc tính đặc biệt',
    "attack" INTEGER NOT NULL DEFAULT 8,
    "sign" TEXT NOT NULL DEFAULT 'add',
    "level" INTEGER NOT NULL DEFAULT 1,
    "rank" TEXT NOT NULL DEFAULT 'N',
    "imgUrl" TEXT NOT NULL DEFAULT 'https://gbf.wiki/images/thumb/3/3f/Weapon_b_1010400000.png/462px-Weapon_b_1010400000.png',
    "SID" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "InfoSkillDefense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'Iron Shield',
    "description" TEXT NOT NULL DEFAULT 'Một cái khiên sắt vững chắc cung cấp sự bảo vệ vừa phải',
    "defense" INTEGER NOT NULL DEFAULT 10,
    "sign" TEXT NOT NULL DEFAULT 'add',
    "level" INTEGER NOT NULL DEFAULT 1,
    "rank" TEXT NOT NULL DEFAULT 'N',
    "imgUrl" TEXT NOT NULL DEFAULT 'https://gbf.wiki/images/thumb/2/2d/Icon_Support_Skill.png/50px-Icon_Support_Skill.png',
    "SID" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "InfoSkillSpecial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'Iron Sword',
    "description" TEXT NOT NULL DEFAULT 'Một thanh kiếm đa năng cung cấp cả tấn công và phòng thủ',
    "attack" INTEGER NOT NULL DEFAULT 15,
    "defense" INTEGER NOT NULL DEFAULT 5,
    "sign_attack" TEXT NOT NULL DEFAULT 'add',
    "sign_defense" TEXT NOT NULL DEFAULT 'add',
    "level" INTEGER NOT NULL DEFAULT 1,
    "rank" TEXT NOT NULL DEFAULT 'N',
    "imgUrl" TEXT NOT NULL DEFAULT 'https://gbf.wiki/images/thumb/3/30/Weapon_b_1010001300.png/462px-Weapon_b_1010001300.png',
    "SID" INTEGER NOT NULL DEFAULT 1
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SkillSlot_skillS1Id_key" ON "SkillSlot"("skillS1Id");

-- CreateIndex
CREATE UNIQUE INDEX "SkillSlot_skillS2Id_key" ON "SkillSlot"("skillS2Id");

-- CreateIndex
CREATE UNIQUE INDEX "SkillSlot_skillS3Id_key" ON "SkillSlot"("skillS3Id");

-- CreateIndex
CREATE UNIQUE INDEX "SkillSlot_skillS4Id_key" ON "SkillSlot"("skillS4Id");

-- CreateIndex
CREATE UNIQUE INDEX "SkillSlot_skillS5Id_key" ON "SkillSlot"("skillS5Id");
