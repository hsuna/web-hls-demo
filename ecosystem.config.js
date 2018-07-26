module.exports = {
    apps: [
      /**blog-server */
      {
        name: "live",
        script: "./server/start.js",
        watch: ['server'],
        env_development: {
          NODE_ENV: "development",
          API_HOST: "/api",
          PORT: "3000",
        },
        env_production: {
          NODE_ENV: "production",
          API_HOST: "/",
          PORT: "3015",
        }
      }
    ]
  }