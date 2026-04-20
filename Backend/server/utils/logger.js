let appInsightsClient = null;

export function setAppInsightsClient(client) {
  appInsightsClient = client;
}

const SEVERITY = { INFO: 1, WARN: 2, ERROR: 3 };

function forwardToAppInsights(level, message, context) {
  if (!appInsightsClient) {
    return;
  }
  try {
    appInsightsClient.trackTrace({
      message,
      severity: SEVERITY[level] ?? 1,
      properties: context && typeof context === "object" ? context : undefined
    });
  } catch {
    // never throw from logging
  }
}

function stringifyContext(context) {
  if (!context || typeof context !== "object") {
    return "";
  }

  const safeEntries = Object.entries(context).filter(([, value]) => value !== undefined);
  if (safeEntries.length === 0) {
    return "";
  }

  return ` ${JSON.stringify(Object.fromEntries(safeEntries))}`;
}

function write(level, message, context) {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] [${level}] ${message}${stringifyContext(context)}`;

  forwardToAppInsights(level, message, context);

  if (level === "ERROR") {
    console.error(formatted);
    return;
  }

  if (level === "WARN") {
    console.warn(formatted);
    return;
  }

  console.log(formatted);
}

export const logger = {
  info(message, context) {
    write("INFO", message, context);
  },
  warn(message, context) {
    write("WARN", message, context);
  },
  error(message, context) {
    write("ERROR", message, context);
  }
};
