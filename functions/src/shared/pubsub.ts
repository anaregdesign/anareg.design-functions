import {PubSub} from "@google-cloud/pubsub";

const pubSubClient = new PubSub();

export async function publishJsonMessage(
  topicName: string,
  data: unknown,
  attributes: Record<string, string>
): Promise<string> {
  const topic = pubSubClient.topic(topicName);
  const payload = Buffer.from(JSON.stringify(data));

  return topic.publishMessage({
    data: payload,
    attributes,
  });
}
