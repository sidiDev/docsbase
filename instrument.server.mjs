import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  dsn: "https://5ceff1e511e1aba1df2f925bb07f1e46@o4508194135146496.ingest.de.sentry.io/4510373993119824",

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});
