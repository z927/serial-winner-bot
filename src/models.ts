import { Timestamp } from "firebase-admin/firestore";

export enum FirestoreUserStatus {
  FirstAccess = "FJ",
  Active = "AC",
}

export interface TelegramUserModel {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
}

export interface FirestoreUserModel extends TelegramUserModel {
  status: FirestoreUserStatus;
  statusDescription: string;
  firstAccessDate: unknown;
  creationTimestamp: unknown;
  admin: boolean;
  inviteLink: FirestoreInviteLinkModel;
  updateTimestamp?: unknown;
}

export interface FirestoreInviteLinkModel {
  link?: string;
  active?: boolean;
}

export interface SubscriptionModel {
  userId: string;
  subscriptionType?: "free" | "premium";
  expirationDate?: string;
  expirationTimestamp?: Timestamp;
}
