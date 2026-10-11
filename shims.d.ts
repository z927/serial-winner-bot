declare module "firebase-functions" {
  export const logger: {
    log: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };

  export function config(): {
    telegram: {
      token: string;
      chat_id: string;
    };
  };

  export function region(region: string): {
    https: {
      onRequest: (handler: (request: any, response: any) => unknown) => unknown;
    };
  };
}

declare module "firebase-admin/app" {
  export function cert(serviceAccount: unknown): unknown;
  export function initializeApp(options: { credential: unknown }): void;
}

declare module "firebase-admin/firestore" {
  export const FieldValue: {
    serverTimestamp: () => any;
  };

  export class Timestamp {
    static fromDate(date: Date): any;
  }

  export function getFirestore(): any;
}

declare module "telegraf" {
  export interface TelegramLike {
    createChatInviteLink: (...args: unknown[]) => Promise<{ invite_link: string }>;
    approveChatJoinRequest: (...args: unknown[]) => Promise<unknown>;
    revokeChatInviteLink: (...args: unknown[]) => Promise<unknown>;
    sendMessage: (...args: unknown[]) => Promise<unknown>;
  }

  export interface ChannelPost {
    chat: {
      id: number;
    };
    message_id: number;
    date: number;
    text?: string;
    caption?: string;
    photo?: unknown;
    video?: unknown;
    document?: unknown;
    sticker?: unknown;
    animation?: unknown;
    voice?: unknown;
    audio?: unknown;
  }

  export interface Context {
    from?: {
      id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    channelPost?: ChannelPost;
    editedChannelPost?: ChannelPost;
    chatJoinRequest?: {
      chat: {
        id: number;
      };
      from: {
        id: number;
      };
    };
    telegram: TelegramLike;
    updateType: string;
    reply: (...args: unknown[]) => Promise<unknown>;
  }

  export class Telegraf {
    constructor(token: string, options?: unknown);
    catch(handler: (err: unknown, ctx: Context) => unknown): void;
    command(command: string, handler: (ctx: Context) => unknown): void;
    hears(text: string, handler: (ctx: Context) => unknown): void;
    on(event: string, handler: (ctx: Context) => unknown): void;
    handleUpdate(update: unknown, webhookResponse?: unknown): Promise<unknown>;
    telegram: TelegramLike;
  }
}
