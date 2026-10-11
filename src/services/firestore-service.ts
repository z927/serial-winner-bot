import { db, getCurrentTimestamp, timestamp } from "../config/firestore-config";
import {
  mapInviteLinkToFirestore,
  mapTelegramUserToFirestoreUser,
  mapUserUpdateToFirestore,
} from "../mapper/user-mapper";
import { constants } from "../utils";
import {
  FirestoreInviteLinkModel,
  FirestoreUserModel,
  SubscriptionModel,
  TelegramUserModel,
} from "../models";

export const saveUser = async (user: TelegramUserModel): Promise<void> => {
  const userRef = db.collection(constants.USERS_COLLECTION).doc(user.userId.toString());
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    throw new Error("User already exists");
  }

  await userRef.set(mapTelegramUserToFirestoreUser(user, timestamp));
};

export const getUser = async (userId: number): Promise<FirestoreUserModel | null> => {
  const userRef = db.collection(constants.USERS_COLLECTION).doc(userId.toString());
  const docSnapshot = await userRef.get();

  if (docSnapshot.exists) {
    return docSnapshot.data() as FirestoreUserModel;
  }

  return null;
};

export const updateUser = async (userId: number): Promise<void> => {
  const userRef = db.collection(constants.USERS_COLLECTION).doc(userId.toString());

  await userRef.update(mapUserUpdateToFirestore(timestamp));
};

export const updateInviteLink = async (
  userId: number,
  inviteLink: FirestoreInviteLinkModel,
): Promise<void> => {
  const userRef = db.collection(constants.USERS_COLLECTION).doc(userId.toString());

  await userRef.update(mapInviteLinkToFirestore(inviteLink));
};

export const getSubscription = async (userId: string): Promise<SubscriptionModel | null> => {
  const currentTimestamp = getCurrentTimestamp();

  const snapshot = await db
    .collection(constants.SUBSCRIPTIONS_COLLECTION)
    .where("userId", "==", userId)
    .where("expirationTimestamp", ">", currentTimestamp)
    .get();

  if (snapshot.empty) {
    console.log("No matching documents.");
    return null;
  }

  let subscription: SubscriptionModel | null = null;

  snapshot.forEach((doc: { data: () => SubscriptionModel }) => {
    subscription = doc.data();
  });

  return subscription;
};
