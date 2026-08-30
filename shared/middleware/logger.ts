import pino from 'pino';

/**
 * Structured logger shared across both agents and shared utilities.
 * Outputs JSON in production, pretty-printed in development.
 */
export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: { service: process.env.SERVICE_NAME || 'myntra-agent' },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
  },
  process.env.NODE_ENV !== 'production'
    ? pino.transport({
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
      })
    : undefined
);

export default logger;
