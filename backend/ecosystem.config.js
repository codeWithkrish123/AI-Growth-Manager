export default {
  apps: [
    {
      name: 'ai-growth-manager',
      script: 'src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '500M',
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      log_file: 'logs/combined.log',
      time: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
    },
  ],
};
