import {setGlobalOptions} from "firebase-functions/v2";

import {REGION} from "./shared/config";

setGlobalOptions({
  region: REGION,
});

export {
  publisherFirestoreInquiryEvents,
} from "./publishers/firestoreInquiryPublisher";
export {
  subscriberDiscordNotifications,
} from "./subscribers/discordNotificationSubscriber";
