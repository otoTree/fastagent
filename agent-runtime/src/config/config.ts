import { z } from 'zod';

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3001),
  mongoUri: z.string().optional(),
  jwtSecret: z.string().optional(),
});

const parseConfig = () => {
  const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001,
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
  };

  try {
    return configSchema.parse(config);
  } catch (error) {
    console.error('❌ Invalid configuration:', error);
    process.exit(1);
  }
};

export const config = parseConfig();
export type Config = z.infer<typeof configSchema>;