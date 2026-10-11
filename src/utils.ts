import { SubscriptionModel } from "./models";

export const constants = {
  USERS_COLLECTION: "channel_users",
  SUBSCRIPTIONS_COLLECTION: "channel_subscriptions",
} as const;

export const convertSubscription = (subscription: SubscriptionModel | null): string => {
  if (subscription?.subscriptionType === "free") {
    return "Gratuito";
  }
  if (subscription?.subscriptionType === "premium") {
    return "A Pagamento";
  }
  return "Non specificato";
};
