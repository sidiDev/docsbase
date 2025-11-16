import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  dsn: "https://70fdbe0e9b78cc6c3eacbe1d415a1e94@o4508194135146496.ingest.de.sentry.io/4510374016450640",

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});
