import {initializeApp} from "firebase-admin/app";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

import * as functions from "firebase-functions/v2";

initializeApp();

export const onDocumentWrite = onDocumentWritten(
  {
    document: "inquiries/{documentId}",
    region: "asia-northeast1",
  },
  async (event) => {
    const data = event.data?.after?.data();

    const webhookUrl = functions.config().discord.webhook.inquiries;

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
    } catch (error) {
      logger.error("Error sending webhook", error);
    }
  }
);
