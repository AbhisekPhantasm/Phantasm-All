export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function envLevel(): LogLevel {
  const l = (process.env.LOG_LEVEL ?? 'info').toLowerCase() as LogLevel;
  return levelOrder[l] ? l : 'info';
}

export function createLogger(scope: string) {
  const min = levelOrder[envLevel()];
  const log =
    (level: LogLevel) =>
    (message: string, meta?: Record<string, unknown>) => {
      if (levelOrder[level] < min) return;
      const payload = meta ? ` ${JSON.stringify(meta)}` : '';
      const line = `${new Date().toISOString()} [${level.toUpperCase()}] [${scope}] ${message}${payload}`;
      globalThis.console?.log(line);
    };
  return {
    debug: log('debug'),
    info: log('info'),
    warn: log('warn'),
    error: log('error'),
  };
}
