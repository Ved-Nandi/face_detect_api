const knex = require("knex");

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "postgres",
    password: "sql",
    database: "smart_brain",
  },
});
db.select("*")
  .from("users")
  .then((res) => console.log(res));
