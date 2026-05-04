# anareg.design-messaging System Specification

## Runtime naming

Messaging runtimes must make their role clear from the deployed runtime name.
Use the same role terms in Firebase Function exports, file paths, logs, docs,
and deployment commands.

### Runtime name format

Use these formats for deployed Firebase Function export names:

```text
publisher<SourceSystem><Domain>Events
subscriber<DestinationPlatform>Notifications
```

Rules:

- `publisher` means the runtime receives a source-system event and publishes a
  normalized notification message to Pub/Sub.
- `subscriber` means the runtime receives a Pub/Sub notification message and
  delivers it to a destination platform or performs downstream processing.
- Publisher names include `<SourceSystem>` and `<Domain>` because publisher
  runtimes are source and domain specific. Example:
  `publisherFirestoreInquiryEvents`.
- Subscriber names include `<DestinationPlatform>` only because subscriber
  runtimes are destination adapters. They must not include a single business
  domain such as `Inquiry` in the deployed name. Example:
  `subscriberDiscordNotifications`.
- Use plural `Events` for publisher event streams so one publisher runtime can
  handle both create and update events in the same domain.
- Use plural `Notifications` for subscriber delivery runtimes so one subscriber
  can route multiple notification message types for the same
  destination platform.

Current runtimes:

- `publisherFirestoreInquiryEvents`: Firestore `inquiries/{documentId}`
  create/update event publisher for Pub/Sub topic `inquiries-events-v1`.
- `subscriberDiscordNotifications`: Pub/Sub subscriber that delivers
  notifications to Discord. It can route by message type while
  keeping Discord-specific delivery behavior isolated.

Do not use trigger-only names such as `onDocumentWrite` for deployed runtimes.
They hide whether the runtime is a publisher or subscriber.

### Message type routing

Notification payloads must not include a `target` field. Delivery routing is
based on destination configuration and the payload `messageType`.

`messageType` is the stable key that future UI can use when a destination
subscribes to notification kinds. Current LP customer inquiry messages use:

- `lp.customerInquiry.created`
- `lp.customerInquiry.updated`

Destination subscribers should skip unsupported `messageType` values without
throwing so one Pub/Sub stream can be shared by multiple destination types.

### Directory ownership

Runtime files must mirror the role in the directory name:

- `functions/src/publishers/*`: source-system event handlers that publish to
  Pub/Sub.
- `functions/src/subscribers/*`: Pub/Sub consumers that deliver to downstream
  systems. Subscriber file names should follow the destination platform, for
  example `discordNotificationSubscriber.ts`.
- `functions/src/shared/*`: payload contracts, serializers, and helpers that
  are shared by both roles.

### Deployment commands

The default release deploys all Functions in the Firebase codebase. Individual
runtime deploys must use the role-prefixed export names:

```sh
firebase deploy --only functions:publisherFirestoreInquiryEvents
firebase deploy --only functions:subscriberDiscordNotifications
```

When a runtime is renamed, the previous Firebase Function name is considered
obsolete and may be deleted during release.
