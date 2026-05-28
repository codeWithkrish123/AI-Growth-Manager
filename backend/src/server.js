import './loadEnv.js'; // 🔥 MUST BE FIRST



import { app }          from './app.js';

import { connectDB }    from './config/database.js';

import { startWorkers } from './workers/index.js';

import { config }       from './config/index.js';

import { logger }       from './utils/logger.js';



async function bootstrap() {

  try {

    // 1. Connect to PostgreSQL database (with fallback)

    try {

      await connectDB();

    } catch (dbErr) {

      logger.warn({ err: dbErr }, 'Database connection failed, continuing without DB');

    }



    // 2. Start all BullMQ background workers (with fallback)

    try {

      startWorkers();

    } catch (workerErr) {

      logger.warn({ err: workerErr }, 'Workers failed to start, continuing without workers');

    }



    // 3. Start HTTP server

    app.listen(config.port, () => {

      logger.info(

        { port: config.port, env: config.env },

        'AI Growth Manager server running'

      );

    });



  } catch (err) {

    logger.error({ err }, 'Failed to start server');

    process.exit(1);

  }

}



// Graceful shutdown on SIGTERM (Docker / k8s stop signal)

process.on('SIGTERM', () => {

  logger.info('SIGTERM received — shutting down gracefully');

  process.exit(0);

});



// Catch unhandled promise rejections so they don't silently swallow errors

process.on('unhandledRejection', (reason) => {

  logger.error({ reason }, 'Unhandled promise rejection');

  process.exit(1);

});



bootstrap();