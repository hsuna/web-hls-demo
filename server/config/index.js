const config = {
    local: {
        NODE_ENV: "localhost",
        API_HOST: "/",
        PORT: "3000",
    }
};
console.log(`process.env.NODE_ENV::${process.env.NODE_ENV}`)

export default process.env.NODE_ENV ? process.env : config.local;
  