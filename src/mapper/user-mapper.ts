import {
  FirestoreInviteLinkModel,
  FirestoreUserModel,
  FirestoreUserStatus,
  TelegramUserModel,
} from "../models";

export const mapTelegramUserToFirestoreUser = (
  user: TelegramUserModel,
  timestamp: unknown,
): FirestoreUserModel => {
  return {
    userId: user.userId,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    status: FirestoreUserStatus.FirstAccess,
    statusDescription: "Primo Accesso",
    firstAccessDate: timestamp,
    creationTimestamp: timestamp,
    admin: false,
    inviteLink: {},
  };
};

export const mapUserUpdateToFirestore = (timestamp: unknown): Record<string, unknown> => {
  return {
    status: FirestoreUserStatus.Active,
    statusDescription: "Attivo",
    "inviteLink.active": false,
    updateTimestamp: timestamp,
  };
};

export const mapInviteLinkToFirestore = (
  inviteLink: FirestoreInviteLinkModel,
): Record<string, unknown> => {
  return {
    inviteLink: inviteLink,
  };
};
