import { resolveCommand, readInjectedCommands, isCommandDisabled, getPrefix } from "../utils/command";
import { reloadModule } from "../utils/cache";
import { AsciiTable3, AlignmentEnum } from "ascii-table3";
import { CM, CommandInfo, Command } from "../types";
import { splitCommands } from "../utils/common";
import { z } from "zod";
import cliProgress from 'cli-progress';
import chalk from "chalk";
import gradient from "gradient-string";
import path from "path";
import fs from "fs";

let df_cd: number = 5000;

export const getDefaultCooldown = () => df_cd;
export const setDefaultCooldown = (cooldown: number) => {
    if (cooldown < 0) {
        console.warn(chalk.yellow("⚠️ Default cooldown cannot be negative, setting to default value of 5000ms."));
        df_cd = 5000;
    }
    df_cd = cooldown;
};

export const CommandInfoSchema = z.object({
    name: z.union([z.string().nonempty("Name cannot be empty"), z.array(z.string()).min(1, "Name cannot be empty")]),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must be in x.y.z format"),
    description: z.string().min(1, "Description cannot be empty"),
    prefix: z.boolean(),
    usage: z.union([z.string(), z.array(z.string())]).optional(),
    example: z.union([z.string(), z.array(z.string())]).optional(),
    cooldown: z.number().int().min(0).optional(),
    permission: z.enum(["user", "admin", "owner"]).optional(),
    hidden: z.boolean().optional(),
    customCooldown: z.boolean().optional(),
    disabled: z.boolean().optional(),
    offline: z.boolean().optional(),
    category: z.union([z.string(), z.array(z.string())]).optional(),
    rules: z
        .object({
            balance: z.union([z.number(), z.bigint()]).optional(),
            level: z.number().int().min(0).optional(),
            exp: z.number().int().min(0).optional(),
        })
        .optional(),
    aliases: z.array(z.string().min(1)).optional(),
    freeUse: z.boolean().optional(),
});
  

const default_command = (info: CommandInfo) => ({
    ...info,
    cooldown: info.cooldown ?? df_cd,
    permission: info.permission ?? "user",
    hidden: info.hidden ?? false,
    customCooldown: info.customCooldown ?? false,
    offline: info.offline ?? false,
    disabled: info.disabled ?? false,
    rules: {
        balance: info.rules?.balance ?? 0,
        level: info.rules?.level ?? 0,
        exp: info.rules?.exp ?? 0,
    },
    aliases: info.aliases ?? [],
    category: info.category ?? "general",
    freeUse: info.freeUse ?? false,
});


export const validateCommandInfo = (info: unknown, filePath: string): CommandInfo | null => {
    const globalPrefix = getPrefix();
    const result = CommandInfoSchema.safeParse(info);
  
    if (!result.success) {
      console.warn(chalk.yellow(`⚠️ Command in file ${filePath} is missing or has incorrect information:`));
      console.warn(result.error.format());
      return null;
    }
  
    const commandInfo = result.data;

    const addPrefixToName = (name: string) => {
        if (name.startsWith('-')) {
            return `${globalPrefix}${name.slice(1)}`;
        }
        return commandInfo.prefix ? `${globalPrefix}${name}` : name;
    };
    
    if (Array.isArray(commandInfo.name)) {
        commandInfo.name = commandInfo.name.map(addPrefixToName);
    } else if (typeof commandInfo.name === "string") {
        commandInfo.name = addPrefixToName(commandInfo.name);
    }
    
    if (commandInfo.aliases) {
        commandInfo.aliases = commandInfo.aliases.map(addPrefixToName);
    }
  
    const defaultCommand = default_command(commandInfo);
  
    const validName = Array.isArray(defaultCommand.name)
      ? defaultCommand.name.find((name) => name !== "")
      : defaultCommand.name;
  
    if (validName && isCommandDisabled(validName)) {
      defaultCommand.disabled = true;
    }
  
    return defaultCommand;
};


const createCommandTable = (commands: (Command & { path: string })[], title: string = "Command List") => {
    const table = new AsciiTable3(gradient.pastel(title)) 
        .setHeading(
            chalk.magentaBright("Name"),
            chalk.blueBright("Version"),  
            chalk.cyanBright("Path")
        )
        .setAlign(2, AlignmentEnum.LEFT) 
        .setStyle("unicode-single")
        .setWrapped(1)  
        .addRowMatrix(commands.map(({ name, version, path }) => [
            chalk.cyanBright(name),     
            chalk.greenBright(version),
            chalk.magentaBright(path)   
        ]));

    return table.toString();
};

interface LoadCommandStatus{
    success: boolean;
    message: string
}

export async function loadCommand(filePath: string, manager: CM): Promise<LoadCommandStatus> {
    try {
        if (!fs.existsSync(filePath)) {
            return {
                success: false,
                message: `File not found: ${filePath}`
            };
        }

        const module = await reloadModule(filePath);

        if (!module || !module.default.info) {
            return {
                success: false,
                message: `Failed to load module: ${filePath}`
            };
        }

        const moduleInfo = module.default.info;

        if (moduleInfo.disabled) {
            return {
                success: false,
                message: `Module is disabled: ${filePath}`
            };
        }

        const info = validateCommandInfo(module.default.info, filePath);
        if (!info) {
            return {
                success: false,
                message: `Invalid command info in file: ${filePath}`
            };
        }

        const command = Array.isArray(info.name)
            ? info.name.map(name => resolveCommand(name, manager, info.offline)).find(cmd => cmd !== undefined)
            : resolveCommand(info.name, manager, info.offline);

        if (command){
            return {
                success: false,
                message: `Command with name "${command.name}" already exists.`
            };
        }

        const newCommand: Command = {
            ...default_command(info),
            path: filePath
        };

        manager.commands.push(newCommand);
        manager.commandCount++;

        return {
            success: true,
            message: `Command loaded successfully from: ${filePath}`
        };

    } catch (error) {
        console.error('Error loading command:', error);

        return {
            success: false,
            message: `Error occurred while loading the command from: ${filePath}`
        };
    }
}


const processCommands = async (commandsPath: string, manager: CM) => {
    let files: string[] = [];
    try {
        files = fs.readdirSync(commandsPath).filter(file => file.endsWith(".ts"));
    } catch (error) {
        console.error(chalk.red(`❌ Error reading commands directory: ${error instanceof Error ? error.message : String(error)}`));
        return;
    }

    if (files.length === 0) {
        console.warn(chalk.yellow("⚠️ No commands found in the commands directory!"));
        return;
    }
    const multiBar = new cliProgress.MultiBar({
        format: chalk.cyan("{bar}") + " " + 
                chalk.green("{percentage_padded}%") + " | " + 
                chalk.yellow("{value}/{total}") + " " + 
                chalk.magenta("{filename}"), 
        hideCursor: true,
    }, cliProgress.Presets.shades_classic);

    const bars = files.map(file => ({
        file,
        bar: multiBar.create(4, 0, { filename: chalk.bold(file)})
    }));

    const updateBars = (i: number) => {
        let progress = bars[i].bar.getProgress() * 100;
        progress = progress >= 99.5 ? 100 : Math.floor(progress);
        
        bars[i].bar.increment(1, { 
            percentage_padded: chalk.blue(`${progress + 25}`.padStart(3, ' '))
        });
    };
    const validCommands = (
        await Promise.all(files.map(async (file, i) => {
            const filePath = path.join(commandsPath, file);
            const module = await reloadModule(filePath);
    
            updateBars(i);
            if (!module || !module.default) return null;
    
            const moduleInfo = module.default.info;
            updateBars(i); 

            if (moduleInfo.disabled) return null;
            updateBars(i);
    
            const info = validateCommandInfo(module.default.info, filePath);
            if (!info) return null;
    
            updateBars(i);
    
            return { ...info, path: filePath };
        }))
    ).filter((cmd): cmd is Command & { path: string } => !!cmd);
    
    multiBar.stop();
    

    const commandNames = validCommands.map(cmd => cmd.name);
    const uniqueNames = new Set(commandNames);
    if (commandNames.length !== uniqueNames.size) {
        console.warn(chalk.yellow("⚠️ Warning: Duplicate command names found."));
    }

    Object.assign(manager, {
        commandCount: validCommands.length,
        commands: validCommands
    });

    const commandGroups = splitCommands(manager.commands);

    if (commandGroups.public.length === 0) return;
    
    console.log(createCommandTable(commandGroups.public));

    if (process.env.DEBUG) {
        console.table(commandGroups.public);
    }
};


const processTempCommands = async (commandsPath: string[], manager: CM) => {
    if (commandsPath.length === 0) {
        console.warn(chalk.yellow("⚠️ No commands found in the commands directory!"));
        return;
    }

    const validCommands = (
        await Promise.all(commandsPath.map(async (filePath) => {
            const module = await reloadModule(filePath);
    
            if (!module) return null;
    
            const moduleInfo = module.default.info;

            if (moduleInfo.disabled) return null;
    
            const info = validateCommandInfo(module.default.info, filePath);
            if (!info) return null;
    
            return { ...info, path: filePath };
        }))
        ).filter((cmd): cmd is Command & { path: string } => !!cmd);
    
    

    const commandNames = validCommands.map(cmd => cmd.name);
    const uniqueNames = new Set(commandNames);
    if (commandNames.length !== uniqueNames.size) {
        console.warn(chalk.yellow("⚠️ Warning: Duplicate command names found."));
    }

    Object.assign(manager, {
        commandCount: manager.commandCount + validCommands.length
    });
    manager.commands.push(...validCommands);

    const commandGroups = splitCommands(validCommands);
    console.log(createCommandTable(commandGroups.public, "Injected Command List"));

    if (process.env.DEBUG) {
        console.table(commandGroups.public);
    }
};




const publicSrc = path.resolve(__dirname, "..", "..", "public");

export default async (manager: CM) => {
    const commandsPath = path.join(__dirname, "..", "commands");

    if (!fs.existsSync(commandsPath)) {
        return console.error(chalk.red(`⚠️ Directory not found: ${commandsPath}`));
    }

    try {
        await processCommands(commandsPath, manager);

        const injectedCommandList = readInjectedCommands();

        if (!injectedCommandList || injectedCommandList.length === 0) {
            console.log("ℹ️ No injected commands found.");
        } else {
            await processTempCommands(injectedCommandList, manager);
        }

        (await reloadModule(path.resolve(__dirname, "commandListRender.ts"), {
            log: {
                debug: false,
            }
        })).default(manager, path.join(publicSrc, "dist", "menu"));
    } catch (error) {
        console.error(chalk.red("❌ Error loading commands:"), error);
    }
};
