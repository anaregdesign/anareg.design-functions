import {initializeApp} from "firebase-admin/app";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

import * as functions from "firebase-functions/v2";

initializeApp();

functions.setGlobalOptions({
  region: "asia-northeast1",
  secrets: ["DISCORD_WEBHOOK_INQUIRIES"],
});

export const onDocumentWrite = onDocumentWritten(
  {
    document: "inquiries/{documentId}",
  },
  async (event) => {
    const data = event.data?.after?.data();

    const webhookUrl = process.env.DISCORD_WEBHOOK_INQUIRIES;
    if (!webhookUrl) {
      logger.error("DISCORD_WEBHOOK_INQUIRIES is not set");
      return;
    }

    const payload = {
      content: "New inquiry received",
      username: "Inquiry Bot",
      embeds: [
        {
          title: "New Inquiry",
          description: "Details of the inquiry",
          fields: Object.entries(data || {}).map(([key, value]) => ({
            name: key,
            value: value instanceof Date ?
              value.toLocaleString("en-US", {timeZone: "Asia/Tokyo"}) :
              String(value),
            inline: true,
          })),
        },
      ],
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
    } catch (error) {
      logger.error("Error sending webhook", error);
    }
  }
);
