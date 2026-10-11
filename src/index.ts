import * as functions from "firebase-functions";
import { Context, Telegraf } from "telegraf";
import { getSubscription, getUser, saveUser, updateInviteLink, updateUser } from "./services/firestore-service";
import { convertSubscription } from "./utils";
import { FirestoreUserStatus, TelegramUserModel } from "./models";

const logger = functions.logger;
const telegramConfig = functions.config().telegram as {
  token?: string;
  chat_id?: string;
  welcome_photo_url?: string;
};

const requireConfigValue = (value: string | undefined, name: string): string => {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    throw new Error(
      `[serial-winner-bot] Missing telegram.${name}. Set it with ` +
        `firebase functions:config:set telegram.${name}="..."`,
    );
  }

  return trimmedValue;
};

const telegramToken = requireConfigValue(telegramConfig?.token, "token");
const telegramChatId = requireConfigValue(telegramConfig?.chat_id, "chat_id");
const telegramWelcomePhotoUrl = telegramConfig?.welcome_photo_url?.trim();

const bot = new Telegraf(telegramToken, {
  telegram: { webhookReply: true },
});

bot.catch((err: unknown, ctx: Context) => {
  logger.error("[Bot] Error", err);
  return ctx.reply(`Ooops, encountered an error for ${ctx.updateType}`);
});

bot.command("start", (ctx) => {
  return ctx.reply(
    "👋 Ciao! Benvenuto in Serial Winner.\n\nPer entrare nel canale ti basta cliccare sul bottone qui sotto e completare la richiesta di accesso.\n\n⚽📈 Ti aspettiamo dentro.",
    {
      reply_markup: {
        keyboard: [["Registrami"]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    },
  );
});

bot.hears("Registrami", async (ctx) => {
  try {
    if (!ctx.from) {
      return ctx.reply("Impossibile identificare l'utente.");
    }

    const user: TelegramUserModel = {
      userId: ctx.from.id,
      username: ctx.from.username ?? "",
      firstName: ctx.from.first_name ?? "",
      lastName: ctx.from.last_name ?? "",
    };

    logger.log("User request", user);

    const existingUser = await getUser(user.userId);

    if (existingUser?.status === FirestoreUserStatus.Active) {
      return ctx.reply("Sei già registrato e attivo nei nostri sistemi.");
    }

    if (!existingUser) {
      await saveUser(user);
    }

    if (existingUser?.inviteLink?.link && existingUser.inviteLink.active) {
      return ctx.reply(
        `Hai già un link attivo. Aprilo per richiedere l'accesso al canale: ${existingUser.inviteLink.link}`,
      );
    }

    let inviteLink;

    try {
      inviteLink = await bot.telegram.createChatInviteLink(telegramChatId, {
        creates_join_request: true,
        name: `serial-winner-${user.userId}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logger.error("[Bot] createChatInviteLink failed", {
        message,
        telegramChatId,
        userId: user.userId,
      });

      if (message.includes("chat not found")) {
        return ctx.reply(
          "Non riesco a trovare il canale Telegram configurato. " +
            "Controlla telegram.chat_id e verifica che il bot sia amministratore del canale o supergruppo.",
        );
      }

      throw error;
    }

    await updateInviteLink(user.userId, {
      link: inviteLink.invite_link,
      active: true,
    });

    return ctx.reply(
      `Benvenuto in Serial Winner! Clicca su questo link per richiedere l'accesso al canale: ${inviteLink.invite_link}`,
    );
  } catch (error) {
    logger.error(error);
    return ctx.reply("Siamo spiacenti, ci risulta che tu sia già registrato nei nostri sistemi!");
  }
});

const logChannelPost = (ctx: Context): void => {
  const post = ctx.channelPost ?? ctx.editedChannelPost;

  if (!post) {
    return;
  }

  const hasMedia = Boolean(
    post.photo ?? post.video ?? post.document ?? post.sticker ?? post.animation ?? post.voice ?? post.audio,
  );

  logger.log("Channel post received", {
    chatId: post.chat.id,
    messageId: post.message_id,
    date: post.date,
    text: post.text ?? post.caption ?? "",
    hasMedia,
  });
};

bot.on("channel_post", logChannelPost);
bot.on("edited_channel_post", logChannelPost);

bot.on("chat_join_request", async (ctx) => {
  logger.log("Join Request", ctx.chatJoinRequest);

  const chatJoinRequest = ctx.chatJoinRequest;

  if (!chatJoinRequest) {
    return;
  }

  const { chat, from } = chatJoinRequest;
  const userId = from.id;

  try {
    const user = await getUser(userId);
    logger.log("user", user);

    if (user === null) {
      logger.log('No user found!');
      return;
    }

    const link = user.inviteLink?.link;
    
    if (!link) {
      logger.warn("Missing invite link for user", userId);
      return;
    }

    await ctx.telegram.approveChatJoinRequest(chat.id, userId);
    logger.log("Approved chat join request");

    await ctx.telegram.revokeChatInviteLink(chat.id, link);
    logger.log("Link was successfully revoked!");

    await updateUser(userId);
    logger.log(`Updated user: [${userId}] and revoked link: [${link}]!`);

    const subscription = await getSubscription(userId.toString());
    logger.log("Retrieved subscription", subscription);

    const name = !user.username || user.username === "" ? user.firstName : user.username;
    const subscriptionType = convertSubscription(subscription);
    const expirationDate = subscription?.expirationDate ?? "data non disponibile";
    const welcomeMessage =
      `🎉 Benvenuto in Serial Winner!\n\n` +
      `✅ La tua iscrizione è stata completata con successo.\n` +
      `📲 Puoi accedere al canale cliccando sul link ricevuto oppure cercando nella barra di ricerca @Mjolnir.\n` +
      `🧾 Abbonamento: ${subscriptionType}\n` +
      `⏳ Scadenza: ${expirationDate}\n\n` +
      `Buona permanenza e buon betting! ⚽📊`;

    if (telegramWelcomePhotoUrl) {
      await (ctx.telegram as any).sendPhoto(userId, telegramWelcomePhotoUrl, {
        caption: `Ciao ${name}!\n\n${welcomeMessage}`,
      });
      return;
    }

    await ctx.telegram.sendMessage(userId, `Ciao ${name}!\n\n${welcomeMessage}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(message);
  }
});

export const serialWinnerBot = functions
  .region("europe-west6")
  .https.onRequest(async (request, response) => {
    try {
      logger.log("Incoming message", request.body);
      await bot.handleUpdate(request.body, response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(message);
    }
  });
