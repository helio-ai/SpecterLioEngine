import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const env = z.enum(['dev', 'prod']).safeParse(process.env.NODE_ENV);

export const NODE_ENV = env.success ? env.data : 'dev';
export const IS_DEV = env.success && env.data === 'dev';
export const IS_PROD = env.success && env.data === 'prod';
export const IS_TEST = process.env.NODE_ENV === 'test';
export const SCRIPT_URL = 'https://cdn.jsdelivr.net/gh/helio-ai/widget@latest/main.js';
export const MAX_LIMIT = 100;
