import {initializeApp} from "firebase-admin/app";
import {setGlobalOptions} from "firebase-functions/v2";

import {REGION} from "./shared/config";

initializeApp();

setGlobalOptions({
  region: REGION,
});

export {onDocumentWrite} from "./publishers/firestoreInquiryPublisher";
export {postInquiryToDiscord} from "./subscribers/discordInquirySubscriber";
