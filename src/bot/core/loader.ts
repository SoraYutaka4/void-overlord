import path from "path";
import { reloadModule } from "../utils/cache";
import { Config as CacheConfig } from "../utils/cache";
import chalk from "chalk";

let botModule: any = null;

export type Config = {
    retries?: number;
    delay?: number;
    cache?: CacheConfig
}

export const loadBotModule = async (config?: Config) => {
    const mergedConfig: Config = { ...{ retries: 3, delay: 2000 }, ...config };

    for (let i = 0; i < (mergedConfig.retries ?? 3); i++) {
        try {
            const module = await reloadModule(path.resolve(__dirname, "..", "core", "botProcesstor.ts"), mergedConfig.cache);
            botModule = module.default;
            return botModule;
        } catch (error) {
            console.error(chalk.yellow(`⚠️ Error loading botModule (attempt ${i + 1}):`, error));
            await new Promise((res) => setTimeout(res, mergedConfig.delay));
        }
    }
    console.error(chalk.red("❌ Failed to load botModule after multiple retries!"));
    return null; 
};

export const getBotModule = () => botModule;

export const handleBotLoad = async (callback: (bot: any) => void) => {
    const bot = await loadBotModule();
    if (!bot) {
        console.error(chalk.red("❌ Bot module load failed!"));
        return;
    }
    callback(bot);
};