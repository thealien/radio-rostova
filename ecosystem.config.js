module.exports = {
  apps: [
    {
      name: 'radiorostova',
      script: './app.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      exec_mode: 'fork',
    },
  ],
};
