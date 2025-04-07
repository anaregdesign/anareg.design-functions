import {initializeApp} from "firebase-admin/app";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

initializeApp();

export const onDocumentWrite = onDocumentWritten(
  {
    document: "inquiries/{documentId}",
    region: "asia-northeast1",
  },
  (event) => {
    const {documentId} = event.params;
    const data = event.data?.after?.data();

    logger.info(
      `Document ${documentId} was written with data: ${JSON.stringify(data)}`
    );
  }
);
