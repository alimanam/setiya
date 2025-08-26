// Load environment variables from .env.local
require('dotenv').config({ path: require('path').join(__dirname, '.env.local') });

module.exports = {
  apps: [{
    name: 'setiya',
    script: 'npm',
    args: 'start',
    // Use the directory where this config file resides as the working directory
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 4040
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}