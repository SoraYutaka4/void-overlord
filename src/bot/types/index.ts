import { ICooldownManager } from "../controllers/cooldownManager";
import { Options as ObfuscateOptionsType } from "../utils/messageTransformer";
import { Config as CacheConfigType } from "../utils/cache";
import { Utils } from "./utilsType";
import { UserManagerInterface } from "./user";
import { EmojiDropConfig } from "../utils/emojiDrop";

export type MessageType = "message" | "message_reply";

export type IFCAU_Thread = {
    threadID: string,
    participantIDs: string[],
    threadName: string,
    userInfo: (IFCAU_User & { id: string })[],
    nicknames: { [id: string]: string } | null,
    unreadCount: number,
    messageCount: number,
    imageSrc: string,
    timestamp: number,
    muteUntil: number | null,
    isGroup: boolean,
    isSubscribed: boolean,
    folder: 'INBOX' | 'ARCHIVE' | string,
    isArchived: boolean,
    cannotReplyReason: string | null,
    lastReadTimestamp: number,
    emoji: string | null,
    color: string | null,
    adminIDs: string[],
    approvalMode: boolean,
    approvalQueue: { inviterID: string, requesterID: string, timestamp: string }[]
}

export type IFCAU_Attachment =
{
    type: "sticker",
    ID: string,
    url: string,
    packID: string,
    spriteUrl: string,
    spriteUrl2x: string,
    width: number,
    height: number,
    caption: string,
    description: string,
    frameCount: number,
    frameRate: number,
    framesPerRow: number,
    framesPerCol: number
} |
{
    type: "file",
    ID: string,
    filename: string,
    url: string,
    isMalicious: boolean,
    contentType: string
} |
{
    type: "photo",
    ID: string,
    filename: string,
    thumbnailUrl: string,
    previewUrl: string,
    previewWidth: number,
    previewHeight: number,
    largePreviewUrl: string,
    largePreviewWidth: number,
    largePreviewHeight: number,
    url: string,
    width: number,
    height: number
} |
{
    type: "animated_image",
    ID: string,
    filename: string,
    previewUrl: string,
    previewWidth: number,
    previewHeight: number,
    url: string,
    width: number,
    height: number
} |
{
    type: "video",
    ID: string,
    filename: string,
    previewUrl: string,
    previewWidth: number,
    previewHeight: number,
    url: string,
    width: number,
    height: number
    duration: number,
    videoType: string
} |
{
    type: "audio",
    ID: string,
    filename: string,
    audioType: string,
    duration: number,
    url: string,
    isVoiceMail: boolean
} |
{
    type: "location",
    ID: string,
    latitude: number,
    longitude: number,
    image: string,
    width: number,
    height: number,
    url: string,
    address: string
} |
{
    type: "share",
    ID: string,
    url: string,
    title: string,
    description: string,
    source: string,
    image: string,
    width: number,
    height: number,
    playable: boolean,
    duration: number,
    playableUrl: string,
    subattachments: any,
    properties: any
}

export type Message = {
    type: "message",
    attachments: IFCAU_Attachment[],
    args: string[],
    body: string,
    isGroup: boolean,
    mentions: { [id: string]: string },
    messageID: string,
    senderID: string,
    threadID: string,
    isUnread: boolean,
    participantIDs: string[]
} |
{
    type: "event",
    author: string,
    logMessageBody: string,
    logMessageData: {
        image: {
            attachmentID: string,
            width: number,
            height: number,
            url: string
        }
    },
    logMessageType: "log:thread-image",
    threadID: string
} |
{
    type: "event",
    author: string,
    logMessageBody: string,
    logMessageData: {
        addedParticipants: {
            fanoutPolicy: string,
            firstName: string,
            fullName: string,
            groupJoinStatus: string,
            initialFolder: string,
            initialFolderId: {
                systemFolderId: string,
            },
            lastUnsubscribeTimestampMs: string,
            userFbId: string,
            isMessengerUser: boolean
        }[],
    },
    logMessageType: "log:subscribe",
    threadID: string,
    participantIDs: string[]
} |
{
    type: "event",
    author: string,
    logMessageBody: string,
    logMessageData: { leftParticipantFbId: string },
    logMessageType: "log:unsubscribe",
    threadID: string,
    participantIDs: string[]
} |
{
    type: "event",
    author: string,
    logMessageBody: string,
    logMessageData: { name: string },
    logMessageType: "log:thread-name",
    threadID: string,
    participantIDs: string[]
} |
{
    type: "event",
    author: string,
    logMessageBody: string,
    logMessageData: {
        theme_color: string,
        gradient?: string,
        should_show_icon: string,
        theme_id: string,
        accessibility_label: string,
        theme_name_with_subtitle: string,
        theme_emoji?: string
    },
    logMessageType: "log:thread-color",
    threadID: string,
    participantIDs: string[]
} |
{
    type: "event",
    author: string,
    logMessageBody: string,
    logMessageData: {
        thread_quick_reaction_instruction_key_id: string,
        thread_quick_reaction_emoji: string,
        thread_quick_reaction_emoji_url: string
    },
    logMessageType: "log:thread-icon",
    threadID: string,
    participantIDs: string[]
} |
{
    type: "event",
    author: string,
    logMessageBody: string,
    logMessageData: {
        nickname: string,
        participant_id: string
    },
    logMessageType: "log:user-nickname",
    threadID: string,
    participantIDs: string[]
} |
{
    type: "event",
    author: string,
    logMessageBody: string,
    logMessageData: {
        THREAD_CATEGORY: string,
        TARGET_ID: string,
        ADMIN_TYPE: string,
        ADMIN_EVENT: 'add_admin' | 'remove_admin'
    },
    logMessageType: "log:thread-admins",
    threadID: string,
    participantIDs: string[]
} |
{
    type: "event",
    author: string,
    logMessageBody: string,
    logMessageData: {
        removed_option_ids: string,
        question_json: string,
        event_type: 'question_creation' | 'update_vote' | 'add_unvoted_option' | 'multiple_updates',
        added_option_ids: string,
        new_option_texts: string,
        new_option_ids: string,
        question_id: string,
    },
    logMessageType: "log:thread-poll",
    threadID: string,
    participantIDs: string[]
} |
{
    type: "event",
    author: string,
    logMessageBody: string,
    logMessageData: { APPROVAL_MODE: '0' | '1', THREAD_CATEGORY: string },
    logMessageType: "log:thread-approval-mode",
    threadID: string,
    participantIDs: string[]
} |
{
    type: "event",
    author: string,
    logMessageBody: string,
    logMessageData: any,
    logMessageType: "log:thread-call",
    threadID: string,
    participantIDs: string[]
} |
{
    type: "typ",
    from: string,
    fromMobile: boolean,
    isTyping: boolean,
    threadID: string
} |
{
    type: "read",
    threadID: string,
    time: number,
} |
{
    type: "read_receipt",
    reader: string,
    threadID: string,
    time: number
} | {
    type: "message_reaction",
    threadID: string,
    messageID: string,
    reaction: string,
    senderID: string,
    userID: string,
    reactionTimestamp: number
} | {
    type: "presence",
    statuses: number,
    timestamp: number,
    userID: string
} | {
    type: "message_unsend",
    threadID: string,
    senderID: string,
    messageID: string,
    deletionnTimestamp: number
} | {
    type: "message_reply"
    attachments: IFCAU_Attachment[],
    args: string[],
    body: string,
    isGroup: boolean,
    mentions: { [id: string]: string },
    messageID: string,
    senderID: string,
    threadID: string,
    isUnread: boolean,
    participantIDs: string[],
    messageReply: {
        attachments: IFCAU_Attachment[],
        body: string,
        isGroup: boolean,
        mentions: { [id: string]: string },
        messageID: string,
        senderID: string,
        threadID: string,
        isUnread: boolean
    }
};

export type IFCAU_Friend = {
    alternativeName: string,
    firstName: string,
    gender: string,
    userID: string,
    isFriend: boolean,
    fullName: string,
    profilePicture: string,
    type: string,
    profileUrl: string,
    vanity: string,
    isBirthday: boolean
}

export type New_Message = {
    body?: string; 
    attachment?: (NodeJS.ReadableStream | Buffer | string)[] | NodeJS.ReadableStream | Buffer | string; 
    mentions?: { 
        tag: string; 
        id: string; 
        fromIndex?: number; 
    }[];
    sticker?: string; 
    replyTo?: string; 
    url?: string; 
    avoid?: {
        obfuscate?: boolean;
        emoji?: boolean;
        delay?: boolean;
        queue?: boolean | number;
    },
    randomImage?: boolean
};

export type MessageInfo = {
    threadID: string; 
    messageID: string; 
    timestamp: number;
}

export type StateMessage = {
    status: "ok" | "error",
    message?: string,
    id: string
}

export type Event = 
    | { type: "message"; message: Message }
    | { type: "message_reply"; message: Message }
    | { type: string; [key: string]: any }; 


export type IFCAU_User = {
    name: string,
    firstName: string,
    vanity?: string,
    thumbSrc: string,
    profileUrl: string | null,
    gender?: number,
    type: string,
    isFriend?: boolean,
    isBirthday?: boolean,
    searchToken?: any,
    alternateName?: string
}

export type IFCAU_ThreadList = {
    threadID: string,
    name: string,
    unreadCount: number,
    messageCount: number,
    imageSrc: string,
    emoji: string | null,
    color: string | null,
    nicknames: { userid: string, nickname: string }[],
    muteUntil: number | null,
    participants: IFCAU_ThreadList_Participants[],
    adminIDs: string[],
    folder: "INBOX" | "ARCHIVED" | "PENNDING" | "OTHER" | string,
    isGroup: boolean,
    customizationEnabled: boolean,
    participantAddMode: string,
    reactionMuteMode: string,
    isArchived: boolean,
    isSubscribed: boolean,
    timestamp: number,
    snippet: string,
    snippetAttachments: string
    snippetSender: string,
    lastMessageTimestamp: number,
    listReadTimestamp: number | null,
    cannotReplyReason: string | null,
    approvalMode: string
}[]

export type IFCAU_ThreadList_Participants =
{
    accountType: "User",
    userID: string,
    name: string,
    shortName: string,
    gender: string,
    url: string,
    profilePicture: string,
    username: string | null,
    isViewerFriend: boolean,
    isMessengerUser: boolean,
    isVerified: boolean,
    isMessageBlockedByViewer: boolean,
    isViewerCoworker: boolean
} |
{
    accountType: "Page",
    userID: string,
    name: string,
    url: string,
    profilePicture: string,
    username: string | null,
    acceptMessengerUserFeedback: boolean,
    isMessengerUser: boolean,
    isVerified: boolean,
    isMessengerPlatformBot: boolean,
    isMessageBlockedByViewer: boolean,
} |
{
    accountType: "ReducedMessagingActor",
    userID: string,
    name: string,
    url: string,
    profilePicture: string,
    username: string | null,
    acceptMessengerUserFeedback: boolean,
    isMessageBlockedByViewer: boolean
} |
{
    accountType: "UnavailableMessagingActor",
    userID: string,
    name: string,
    url: null,
    profilePicture: string,
    username: null,
    acceptMessengerUserFeedback: boolean,
    isMessageBlockedByViewer: boolean
} |
{
    accountType: string,
    userID: string,
    name: string
};

export type Middleware_API = {
    sendMessage: (
        message: New_Message | string,
        threadID: string,
        callback?: (error: string | null, messageInfo: MessageInfo) => void,
        messageID?: string
    ) => void;
    unsendMessage: (messageID: string, callback?: (err?: Error) => void) => Promise<void>;
    getUserInfo: (userID: string | string[], callback?: (error: string | null, userInfo: Record<string, IFCAU_User>) => void) => Promise<Record<string, IFCAU_User>>;
    sendTypingIndicator(
        threadID: string,
        callback?: (err: Error | null) => void
    ): void;
    getCurrentUserID: () => string,
    getThreadInfo: (threadID: string, callback?: (err: Error | null, thread: IFCAU_Thread) => void) => Promise<IFCAU_Thread>,
    [key: string]: (...args: any[]) => any;
};

export type API = {
    changeAdminStatus: (threadID: string, adminIDs: string | string[], adminStatus: boolean, callback?: (err?: Error) => void) => Promise<void>,
    changeArchivedStatus: (threadOrThreads: string | string[], archive: boolean, callback?: (err?: Error) => void) => Promise<void>,
    changeGroupImage: (image: ReadableStream, threadID: string, callback?: (err?: Error) => void) => Promise<void>,
    setTitle: (newTitle: string, threadID: string, callback?: (err?: Error) => void) => Promise<void>,
    createPoll: (title: string, threadID: string, options?: { [item: string]: boolean }, callback?: (err?: Error) => void) => Promise<void>,
    changeThreadColor: (color: string, threadID: string, callback?: (err?: Error) => void) => Promise<void>,
    changeThreadEmoji: (emoji: string | null, threadID: string, callback?: (err?: Error) => void) => Promise<void>,
    createNewGroup: (participantIDs: string[], groupTitle?: string, callback?: (err: Error, threadID: string) => void) => Promise<string>,
    markAsDelivered(threadID: string, messageID: string, callback?: (err?: Error) => void): Promise<void>,
    markAsRead(threadID: string, read?: boolean, callback?: (err?: Error) => void): Promise<void>,
    markAsReadAll: (callback?: (err?: Error) => void) => Promise<void>,
    markAsSeen(seenTimestamp?: number, callback?: (err?: Error) => void): Promise<void>,
    muteThread: (threadID: string, muteSeconds: number, callback?: (err?: Error) => void) => Promise<void>,
    pinMessage: (pinMode: boolean, messageID: string, threadID: string, callback?: (err?: Error) => void) => Promise<void>,
    setTheme: (themeID?: string, threadID?: string, callback?: (err?: Error) => void) => Promise<void>,
    sendMessage: (
        message: New_Message | string,
        threadID: string,
        callback?: (error: string | null, messageInfo: MessageInfo) => void,
        replyMessageID?: string
    ) => Promise<MessageInfo> | void;
    sendTypingIndicator(threadID: string, callback?: (err: Error | null) => void): void;
    setMessageReaction: (reaction: string, messageID: string, callback?: (err?: Error) => void, forceCustomReaction?: boolean) => Promise<void>,
    changeNickname: (nickname: string, threadID: string, pariticipantID: string, callback?: (err?: Error) => void) => Promise<void>,
    unsendMessage: (messageID: string, callback?: (err?: Error) => void) => Promise<void>,
    getCurrentUserID: () => string,
    getUserInfo: (userOrUsers: string | string[], callback?: (err: Error | null, users: { [id: string]: IFCAU_User }) => void) => Promise<{ [id: string]: IFCAU_User }>,
    getThreadInfo: (threadID: string, callback?: (err: Error | null, thread: IFCAU_Thread) => void) => Promise<IFCAU_Thread>,
    getFriendsList: (callback?: (err: Error | null, friends: IFCAU_Friend[]) => void) => Promise<IFCAU_Friend[]>,
    getThreadHistory: (threadID: string, amount: number, time?: number, callback?: (err: Error | null, messages: any[]) => void) => Promise<any[]>,
    getThreadList: (limit: number, timestamp: number | null, tags: string[], callback?: (err: Error | null, threads: IFCAU_ThreadList) => void) => Promise<IFCAU_ThreadList>,
    [key: string]: (...args: any[]) => any;
};

export type Command = {
    name: string | string[];
    description: string;
    version: string;
    path: string;
    cooldown: number;
    usage?: string | string[];
    example?: string | string[];
    customCooldown: boolean;
    prefix: boolean;
    offline: boolean;
    disabled: boolean;
    category: string | string[];
    rules: {
        balance: number | bigint;
        level: number;
        exp: number;
    };
    permission: "user" | "admin" | "owner";
    hidden: boolean;
    aliases?: string[]; 
    freeUse: boolean;
};

export type botProcesstorConfig = {
    emojiDrop?: EmojiDropConfig;
}

export type Config = ObfuscateOptionsType & botProcesstorConfig & {
    cache: CacheConfigType;
    df_cooldown?: number;
};

export type CM = {
    commandCount: number;
    messageCount: number;
    commands: Command[];
    cooldowns: ICooldownManager;
    users: UserManagerInterface;
    publicPath: string;
    config: Config,
    interactionsCount: Map<string, number>,
    groupInteractionsCount: Map<string,number>
};


export interface CommandInfo {
    name: string | string[];
    version: string;
    description: string;
    prefix: boolean;
    cooldown?: number;
    permission?: "user" | "admin" | "owner";
    hidden?: boolean;
    usage?: string | string[];
    example?: string | string[];
    customCooldown?: boolean;
    disabled?: boolean;
    offline?: boolean;
    category?: string | string[];
    rules?: {
        balance?: number | bigint;
        level?: number;
        exp?: number;
    };
    aliases?: string[];
    credits?: string;
    freeUse?: boolean;
}

export type ParsedMessage = {
    body: string;     
    args: string[];  
    query: Record<string, string>,
    commandName?: string;
};

export type CommandMessage = {
    type: "message",
    attachments: IFCAU_Attachment[],
    args?: string[],
    body: string,
    isGroup?: boolean,
    mentions: { [id: string]: string },
    messageID: string,
    senderID: string,
    threadID: string,
    isUnread?: boolean,
    participantIDs?: string[]
}

export type UserInfo_API = {
    id: string;
    name: string;
    firstName: string;
    level: number;
    exp: number;
    balance: bigint;
}

export type Execute_Args = {
    api: API;
    manager: CM;
    global: any;
    userInfo: UserInfo_API,
    botInfo: IFCAU_User
} & Utils;

export type BotCommand = {
    info: CommandInfo;
    execute: (
        args: Execute_Args & 
        { 
            message: CommandMessage,
            parsedMessage: ParsedMessage;

        }) => void
};


export type BotEvent = {
    info: CommandInfo;
    execute: (args: Execute_Args & { message: Exclude<Message, { type: "message" }> }) => void
};