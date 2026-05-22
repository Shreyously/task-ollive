import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).required(),
  REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).required(),
  INFERENCE_QUEUE_NAME: Joi.string().default('inference-events'),
  WORKER_CONCURRENCY: Joi.number().integer().positive().default(5),
  WORKER_MAX_RETRIES: Joi.number().integer().positive().default(4),
  DLQ_NAME: Joi.string().default('inference-events-dlq'),
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('info'),
});
