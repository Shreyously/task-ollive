import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  API_HOST: Joi.string().default('0.0.0.0'),
  API_PORT: Joi.number().port().default(3001),
  API_CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  CORRELATION_ID_HEADER: Joi.string().default('x-correlation-id'),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).required(),
  REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).required(),
  INFERENCE_QUEUE_NAME: Joi.string().default('inference-events'),
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('info'),
  THROTTLE_TTL_MS: Joi.number().integer().positive().default(60000),
  THROTTLE_LIMIT: Joi.number().integer().positive().default(120),
});
