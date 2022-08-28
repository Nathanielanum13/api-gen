const { createLogger, transports, format } = require("winston");
const { timestamp, printf, combine, colorize } = format;

const log = (log: {
  level: string;
  message: string;
  timestamp: string;
  [x: string | symbol]: string | symbol;
}) => {
  const logLevel = log[Object.getOwnPropertySymbols(log)[0]];
  const formatedLogLevel = log.level.replace(
    `${String(logLevel)}`,
    `${String(logLevel).toUpperCase()}`
  );
  log.level = formatedLogLevel;
  return `[${log.level}] [::] ${log.timestamp} [::] ${log.message}`;
};

const logFile = (log: { level: string; message: string; timestamp: string }) =>
  `[${log.level.toUpperCase()}] [::] ${log.timestamp} [::] ${log.message}`;

const consoleFormat = combine(timestamp(), colorize(), printf(log));

const fileFormat = combine(timestamp(), printf(logFile));

const logger = createLogger({
  transports: [
    new transports.File({
      filename: `${process.env.API_GEN_ERROR_LOG_DIR}/error.log`,
      format: fileFormat,
      level:
        process.env.API_GEN_ENVIRONMENT !== "production" ? "silly" : "info",
    }),
    new transports.Console({
      level:
        process.env.API_GEN_ENVIRONMENT !== "production" ? "silly" : "info",
      format: consoleFormat,
    }),
  ],
});

module.exports = logger;
