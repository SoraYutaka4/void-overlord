import { 
    createPrompt, removePrompt, getPrompt, hasPrompt, 
    clearAllPrompt, isAdministrator, isOwnerAllowed,
    removeDiacritics, transformTextWithStyle,
    addAdministrator, addToBlacklist, addOwnerPermission,
    getAdminList, hasItemInInventory, removeAdministrator,
    removeOwnerPermission, readInventory, removeFromBlacklist,
    isBlacklisted, getBlacklist, getOwnerPermissions,
    isAnyOwnerAllowed, addItemToInventory,
    removeItemFromInventory, getInventoryById, reloadModule,
    parseAmountWithSuffix, getPrefix
} from "../utils";

import { isUserError, getUserErrorMessage } from "../controllers/usersManager";

export type Prompt = {
    /**
     * Create a new prompt
     */
    create: typeof createPrompt;

    /**
     * Remove a prompt by its ID
     */
    remove: typeof removePrompt;

    /**
     * Get the content of a prompt by its ID
     */
    get: typeof getPrompt;

    /**
     * Check if a prompt exists by its ID
     */
    has: typeof hasPrompt;

    /**
     * Clear all prompts
     */
    clear: typeof clearAllPrompt;
};

export type Admin = {
    /**
     * Check if the user is an admin
     */
    is: typeof isAdministrator;

    /**
     * Get the list of admin users
     */
    get: typeof getAdminList;

    /**
     * Add a user to the admin list
     */
    add: typeof addAdministrator;

    /**
     * Remove a user from the admin list
     */
    remove: typeof removeAdministrator;
};

export type BlackList = {
    /**
     * Get the list of blacklisted users
     */
    get: typeof getBlacklist;

    /**
     * Check if the user is blacklisted
     */
    is: typeof isBlacklisted;

    /**
     * Add a user to the blacklist
     */
    add: typeof addToBlacklist;

    /**
     * Remove a user from the blacklist
     */
    remove: typeof removeFromBlacklist;
};

export type Owner = {
    /**
     * Add ownership permission for a user
     */
    add: typeof addOwnerPermission;

    /**
     * Remove ownership permission from a user
     */
    remove: typeof removeOwnerPermission;

    /**
     * Check if the user has ownership
     */
    is: typeof isOwnerAllowed;

    /**
     * Get a list of ownership permissions for a user
     */
    get: typeof getOwnerPermissions;

    /**
     * Check if any user has ownership permissions
     */
    any: typeof isAnyOwnerAllowed;
};

export type Inventory = {
    /**
     * Check if a user has a specific item in their inventory
     */
    has: typeof hasItemInInventory;

    /**
     * Add an item to a user's inventory
     */
    add: typeof addItemToInventory;

    /**
     * Remove an item from a user's inventory
     */
    remove: typeof removeItemFromInventory;

    /**
     * Get the list of items in a user's inventory
     */
    get: typeof getInventoryById;

    /**
     * Read the entire inventory of all users
     */
    all: typeof readInventory;
};

export type Utils = {
    /**
     * Operations related to prompts (create, remove, get, check, clear all)
     */
    cprompt: Prompt;

    /**
     * Operations related to admin (check, get list, add, remove)
     */
    admin: Admin;

    /**
     * Operations related to blacklist (check, add, remove)
     */
    blacklist: BlackList;

    /**
     * Operations related to ownership (add, remove, check, get permissions)
     */
    owner: Owner;

    /**
     * Operations related to inventory (check, add, remove item)
     */
    inventory: Inventory;

    /**
     * Apply style to text
     */
    styleText: typeof transformTextWithStyle;

    /**
     * Remove diacritics from a string
     */
    normalizeText: typeof removeDiacritics;

    /**
     * Reload a module
     */
    reloadModule: typeof reloadModule;

    /**
     * Converts a string containing a number with a suffix into a numerical value.
     * Supports common suffixes such as "k", "m", "b", "t", "q" (basic units) and extended suffixes.
     * 
     * Examples:
     * - "1k" => 1000
     * - "2.5m" => 2500000
     * - "1.2b" => 1200000000
     * 
     * @returns The numerical value corresponding to the input string with the suffix converted to a number.
     */
    parseAmount: typeof parseAmountWithSuffix;

    /**
     * A function that checks whether a given error is a user-related error.
     */
    isUserError: typeof isUserError;

    /**
     * A function that maps user error codes to readable messages.
     * The error code is extracted from the error and used here to get a user-friendly message.
     */
    UserErrorMessages: typeof getUserErrorMessage;

    /**
     * Get prefix function
     */
    getPrefix: typeof getPrefix;
};


export const utils: Utils = {
    cprompt: {
        create: createPrompt,
        remove: removePrompt,
        get: getPrompt,
        has: hasPrompt,
        clear: clearAllPrompt
    },
    admin: {
        is: isAdministrator,
        get: getAdminList,
        add: addAdministrator,
        remove: removeAdministrator
    },
    blacklist: {
        get: getBlacklist,
        is: isBlacklisted,
        add: addToBlacklist,
        remove: removeFromBlacklist
    },
    owner: {
        add: addOwnerPermission,
        remove: removeOwnerPermission,
        is: isOwnerAllowed,
        get: getOwnerPermissions,
        any: isAnyOwnerAllowed
    },
    inventory: {
        has: hasItemInInventory,
        add: addItemToInventory,
        remove: removeItemFromInventory,
        get: getInventoryById,
        all: readInventory
    },
    styleText: transformTextWithStyle,
    normalizeText: removeDiacritics,
    reloadModule: reloadModule,
    parseAmount: parseAmountWithSuffix,
    isUserError,
    UserErrorMessages: getUserErrorMessage,
    getPrefix,
};
