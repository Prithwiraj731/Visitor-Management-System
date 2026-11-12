import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

const dialect = process.env.DB_DIALECT || 'sqlite';
let sequelize;

if (process.env.DATABASE_URL) {
  const sslCa = process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replace(/\\n/g, '\n') : undefined;
  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' || Boolean(sslCa);

  if (process.env.NODE_ENV === 'production' && !rejectUnauthorized) {
    logger.warn(
      'Postgres SSL certificate verification is disabled (DB_SSL_REJECT_UNAUTHORIZED != true). Supply DB_SSL_CA and enable strict verification in production.'
    );
  }

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    dialectOptions: process.env.NODE_ENV === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized,
        ...(sslCa ? { ca: sslCa } : {})
      }
    } : {}
  });
} else if (dialect === 'postgres') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'vms_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: (msg) => logger.debug(msg)
    }
  );
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './vms_database.sqlite',
    logging: false
  });
}

export { sequelize };
