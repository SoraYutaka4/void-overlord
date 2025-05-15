import fs from "fs";
import path from "path";

export interface CooldownStatus {
  onCooldown: boolean;
  remaining: number;
}

export interface ICooldownManager {
  setCooldown(userId: string, commandName: string, duration: number): void;
  removeCooldown(userId: string, commandName: string): void;
  clearAllCooldowns(): void;
  isOnCooldown(userId: string, commandName: string): CooldownStatus;
  getRemainingCooldown(userId: string, commandName: string): number;
  saveToFile(path: string): void;
  loadFromFile(path: string): void;
  startAutoSave(path: string, interval?: number): void;
}

export class CooldownManager implements ICooldownManager {
  private cooldowns: Map<string, number>;
  private autoSaveInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cooldowns = new Map();
  }

  private getKey(userId: string, commandName: string): string {
    return `${userId}:${commandName}`;
  }

  public setCooldown(userId: string, commandName: string, duration: number): void {
    const key = this.getKey(userId, commandName);
    const expireTime = Date.now() + duration;
    this.cooldowns.set(key, expireTime);
  }

  public isOnCooldown(userId: string, commandName: string): CooldownStatus {
    const key = this.getKey(userId, commandName);
    const expireTime = this.cooldowns.get(key);

    if (expireTime) {
      const remaining = Math.floor((expireTime - Date.now()));
      if (remaining > 0) {
        return { onCooldown: true, remaining };
      } else {
        this.cooldowns.delete(key);
      }
    }
    return { onCooldown: false, remaining: 0 };
  }

  public getRemainingCooldown(userId: string, commandName: string): number {
    const key = this.getKey(userId, commandName);
    const expireTime = this.cooldowns.get(key);

    if (expireTime) {
      const remaining = Math.floor((expireTime - Date.now()));
      return remaining > 0 ? remaining : 0;
    }
    return 0;
  }

  public saveToFile(filePath: string): void {
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const obj: Record<string, number> = {};
    this.cooldowns.forEach((value, key) => {
      obj[key] = value;
    });

    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
  }

  public loadFromFile(path: string): void {
    if (!fs.existsSync(path)) return;
    const data = fs.readFileSync(path, "utf-8");
    const obj: Record<string, number> = JSON.parse(data);
    this.cooldowns = new Map(Object.entries(obj));
    console.log(`📥 Cooldowns loaded from ${path}`);
  }

  public startAutoSave(path: string, interval: number = 5000): void {
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);

    this.autoSaveInterval = setInterval(() => {
      this.cleanupExpired(); 
      this.saveToFile(path);
    }, interval);

    process.on("SIGINT", () => {
      console.log("\n💾 Saving cooldowns before exit...");
      this.cleanupExpired();
      this.saveToFile(path);
      process.exit();
    });
  }

  private cleanupExpired(): void {
    let removed = 0;
    const now = Date.now();
    for (const [key, expireTime] of this.cooldowns.entries()) {
      if (expireTime <= now) {
        this.cooldowns.delete(key);
        removed++;
      }
    }
  }

  public removeCooldown(userId: string, commandName: string): void {
    const key = this.getKey(userId, commandName);
    this.cooldowns.delete(key);
  }

  public clearAllCooldowns(): void {
    this.cooldowns.clear();
  }
  
}
