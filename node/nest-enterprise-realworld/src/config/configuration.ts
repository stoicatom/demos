export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_DATABASE || 'nest_enterprise_db',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_key_nest_enterprise_2026',
    expiresIn: process.env.JWT_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key_nest_enterprise_2026',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
});
