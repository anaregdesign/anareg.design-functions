import {initializeApp} from "firebase-admin/app";
import {setGlobalOptions} from "firebase-functions/v2";

import {REGION} from "./shared/config";

initializeApp();

setGlobalOptions({
  region: REGION,
});

export {
  publisherFirestoreInquiryEvents,
} from "./publishers/firestoreInquiryPublisher";
export {
  subscriberDiscordInquiryEvents,
} from "./subscribers/discordInquirySubscriber";
