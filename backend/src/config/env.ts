import { z } from 'zod'
import 'dotenv/config'

// Environment variables schema
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // JWT Expiry
  JWT_ACCESS_EXPIRY: z.string(),
  JWT_REFRESH_EXPIRY: z.string(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  RATE_LIMIT_ADMIN_MAX_REQUESTS: z.string().default('1000'),

  // CORS
  CORS_ORIGIN: z.string().url(),

  // R2 Cloudflare
  R2_ACCOUNT_ID: z.string().default(''),
  R2_ACCESS_KEY_ID: z.string().default(''),
  R2_SECRET_ACCESS_KEY: z.string().default(''),
  R2_API_TOKEN: z.string().default(''),
  R2_BUCKET_NAME: z.string().default('uploads'),
  R2_PUBLIC_URL: z.string().default(''),
})

export type Env = z.infer<typeof envSchema>

// Parse and validate environment
function loadEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('Environment validation failed:', result.error.format())
    process.exit(1)
  }

  return result.data
}

export const env = loadEnv()