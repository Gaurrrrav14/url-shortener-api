import * as z from "zod";

const envSchema = z.object({
    NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

    PORT: z.coerce.number().default(3000),

    DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .url("DATABASE_URL must be a valid URL"),

    REDIS_URL: z
    .string()
    .min(1, "REDIS_URL is required"),

    JWT_SECRET: z
    .string()
    .min(1, "JWT_SECRET is required")
    .min(32, "JWT_SECRET must be at least 32 characters long"),

    BASE_URL: z
    .string()
    .min(1, "BASE_URL is required")
    .url("BASE_URL must be a valid URL"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("Invalid environment variables:", parsedEnv.error.format());
    process.exit(1);
}

const env = parsedEnv.data;

export default env;