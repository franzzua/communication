import * as process from "process";
import * as path from "path";

export const env = process.env.environment as 'local'|'dev'|'prod';
export const domain = env == 'local' ? 'context.app' : 'context.hair';
export const rootDir = env == 'local' ? path.resolve(import.meta.url.substring('file://'.length), '../../../../.data') : '/app';
console.log(env, rootDir, import.meta.url);