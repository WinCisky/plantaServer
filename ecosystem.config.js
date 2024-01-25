module.exports = {
  apps: [
    {
      name: 'plantaServer',
      script: 'index.js',
      watch: true, // Enable automatic restart on file changes (optional)
      ignore_watch: ['node_modules', 'logs'], // Directories/files to ignore when watching for changes (optional)
      instances: 1, // Number of instances to run (can be increased for clustering)
      exec_mode: 'fork', // Run in fork mode for better isolation
      max_memory_restart: '8G', // Restart if the process exceeds specified memory limit
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        // Add any other environment variables your application may need
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z', // Specify log date format (optional)
      error_file: 'logs/error.log', // Specify the error log file location
      out_file: 'logs/out.log', // Specify the output log file location
      combine_logs: true, // Combine logs from different instances into one file
      // rotate logs 100M
      logrotate: {
        max_size: '100M',
        retain: 10,
        compress: true,
        dateformat: 'YYYY-MM-DD',
      }
    },
  ],
};

