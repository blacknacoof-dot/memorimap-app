export const logger = {
    debug: (...args: any[]) => {
        if (import.meta.env.DEV) {
            console.log('🚧 [DEBUG]', ...args);
        }
    },
    info: (...args: any[]) => {
        console.log('ℹ️ [INFO]', ...args);
    },
    warn: (...args: any[]) => {
        console.warn('⚠️ [WARN]', ...args);
    },
    error: (...args: any[]) => {
        console.error('🚨 [ERROR]', ...args);
    }
};
