import path from "path";
import fsPromises from "fs/promises";
import fs from "fs";
import { pathToFileURL } from "url";
import { createRequire } from "module";
import { z } from "zod";
import chalk from "chalk";

const requireModule = createRequire(__filename);
const PathSchema = z.string().min(1, "Invalid path!").trim();

type DebugOptions = "resolvePath" | "cacheClear" | "importUrl"; 
export type Config = {
    log?: {
        debug?: (DebugOptions | "all")[] | false;
        info?: ("loading" | "loaded")[] | false | true;
        error?: boolean;
    };
};


const shouldDebug = (config: Config | undefined, type: DebugOptions): boolean => {
    if (config?.log?.debug === false || !config?.log?.debug) return false; 
    return config.log.debug.includes("all") || config.log.debug.includes(type);
};

const shouldInfo = (config: Config | undefined, type: "loading" | "loaded"): boolean => {
    if (!config || config.log?.info === false || !Array.isArray(config.log?.info)) return false;
    return config?.log?.info?.includes(type) ?? false;
};



/**
 * Reloads a TypeScript module from the given path.
 * This function dynamically reloads CommonJS or ES Modules, clearing the cache if needed.
 * 
 * ---
 * 
 * ✅ **CommonJS:** Uses `require` and clears `require.cache` before reloading.  
 * ✅ **ES Module:** Uses `import()` with a timestamped URL to force reloading.
 * 
 * ---
 * 
 * @param {string} modulePathOrDir - The path to the module to reload.
 * @param {Config} [config={}] - Configuration options for logging.
 * @param {("resolvePath" | "cacheClear" | "importUrl" | "all")[]} [config.log.debug] -  
 *        Specify which debug logs should be enabled.  
 *        - `"resolvePath"` → Logs when the file path is resolved.  
 *          _Example output:_ `📂 File Path Resolved: /path/to/module.ts`  
 *        - `"cacheClear"` → Logs when clearing the module cache (CommonJS).  
 *          _Example output:_ `🧹 Clearing cache for: /path/to/module.ts`  
 *        - `"importUrl"` → Logs the generated import URL for ES Module reloading.  
 *          _Example output:_ `🌍 Importing module from URL: file:///path/to/module.ts?update=1712000000000`  
 *        - `"all"` → Enables all debug logs.  
 * 
 * @param {boolean} [config.log.info=true] -  
 *        Enable general information logs.
 * @param {boolean} [config.log.error=true] -  
 *        Enable error logging.
 * 
 * @returns {Promise<any>} - The reloaded module, or `null` if an error occurs.
 * 
 * @example
 * ```ts
 * // Reload a module with specific debug logs enabled
 * reloadModule("./controllers/commandHandler", {
 *     log: {
 *         debug: ["resolvePath", "importUrl"], // Enable debug logs for path resolving & import URLs
 *         info: true, // Show info logs
 *         error: true // Show error logs
 *     }
 * });
 * ```
 */


export async function reloadModule(modulePathOrDir: string, config: Config = {}): Promise<any> {
    config.log = {
        info: true,
        error: true,
        ...config.log,
    };

    const validPath = PathSchema.safeParse(modulePathOrDir);
    if (!validPath.success) {
        if (config.log?.error ?? true) console.error(chalk.red("❌ Error:"), validPath.error.format());
        return null;
    }

    let filePath: string = modulePathOrDir.endsWith(".ts") ? modulePathOrDir : `${modulePathOrDir}.ts`;
    filePath = path.resolve(filePath);

    if (shouldDebug(config, "resolvePath")) console.log(chalk.yellow(`📂 File Path Resolved: ${filePath}`));

    if (!fs.existsSync(filePath)) {
        if (config.log?.error) console.error(chalk.red(`❌ Error: File "${filePath}" does not exist.`));
        return null;
    }

    try {
        if (shouldInfo(config, "loading")) console.log(chalk.blue(`🔄 Loading module: ${filePath}`));

        if (typeof require !== "undefined" && typeof require.cache !== "undefined") {
            if (shouldDebug(config, "cacheClear")) console.log(chalk.yellow(`🧹 Clearing cache for: ${filePath}`));
            delete requireModule.cache[requireModule.resolve(filePath)];
            const module = requireModule(filePath);
            if (shouldInfo(config, "loaded")) console.log(chalk.green(`✅ CommonJs Module loaded successfully: ${filePath}`));
            return module;
        }

        const moduleUrl = pathToFileURL(filePath).href + `?update=${Date.now()}`;
        if (shouldDebug(config, "importUrl")) console.log(chalk.yellow(`🌍 Importing module from URL: ${moduleUrl}`));
        const module = await import(moduleUrl);
        if (shouldInfo(config, "loaded")) console.log(chalk.green(`✅ ES Module loaded successfully: ${filePath}`));
        return module;
    } catch (err) {
        if (config.log?.error ?? true) console.error(chalk.red(`❌ Failed to reload module: ${filePath}`), err);
        return null;
    }
}

let reloadTimeout: NodeJS.Timeout | null = null;

/**
 * Watches a specified flag file for changes and executes a callback when modified.
 * This function is useful for triggering actions when a file update is detected.
 * 
 * ---
 * 
 * 🛠 **How It Works:**  
 * - Monitors the given file using `fs.watchFile()`.  
 * - If the file is modified, waits briefly (debounce) before executing the callback.  
 * - After triggering the callback, the flag file is deleted to prevent continuous triggering.  
 * 
 * ---
 * 
 * @param {string} watchPath - The path to the flag file to watch.  
 *                             Đường dẫn tới file cần theo dõi.
 * @param {() => void} callback - A function to execute when the file changes.  
 *                                Hàm callback sẽ được gọi khi file thay đổi.
 * 
 * ---
 * 
 * ✅ **Example Usage:**
 * ```ts
 * watchFlagFile("./reload.flag", () => {
 *     console.log("⚡ Reload triggered!");
 * });
 * ```
 * _When the file `"./reload.flag"` is modified, the callback will run and the file will be deleted._
 */
export function watchFlagFile(watchPath: string, callback: () => void): void {
    const validPath = PathSchema.safeParse(watchPath);
    if (!validPath.success) {
        console.error(chalk.red("❌ Invalid watch path:"), validPath.error.format());
        return;
    }

    const flagPath = path.resolve(watchPath);
    console.log(chalk.blue(`👀 Watching for changes: ${flagPath}`));

    fs.watchFile(flagPath, { interval: 500 }, async (curr, prev) => {
        if (curr.mtime <= prev.mtime) return;

        if (reloadTimeout) clearTimeout(reloadTimeout);

        reloadTimeout = setTimeout(async () => {
            console.log(chalk.blue("🚀 Detected file change - Executing callback..."));

            try {
                await fsPromises.unlink(flagPath);
                console.log(chalk.green("🗑 Deleted flag file to prevent loop."));
            } catch (err: any) {
                if (err.code !== "ENOENT") {
                    console.error(chalk.red("❌ Failed to delete flag file:"), err);
                }
            }

            callback();
        }, 1000);
    });
}
