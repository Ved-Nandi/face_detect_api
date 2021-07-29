const express = require("express");
const cors = require("cors");
const knex = require("knex");
const Clarifai = require("clarifai");
const bcrypt = require("bcrypt");
const app = express();
app.use(cors());
app.use(express.json());

const saltRounds = 10;

// settingup database
const db = knex({
  client: "pg",
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  },
});

app.get("/", (req, res) => res.json("working"));

// signin
app.post("/singin", (req, res) => {
  const { email, password } = req.body;

  db.select("email", "hash")
    .from("login")
    .where("email", "=", email)
    .then(async (data) => {
      if (data.length) {
        const valid = bcrypt.compareSync(password, data[0].hash);
        if (valid) {
          db.select("*")
            .from("users")
            .where("email", "=", email)
            .then((user) => {
              res.json(user[0]);
            });
        } else {
          res.status(400).json("error");
        }
      } else {
        res.status(400).json("error");
      }
    });
});

// register
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  console.log("====================================");
  console.log("in register");
  console.log("====================================");

  const hash = bcrypt.hashSync(password, saltRounds);

  db.transaction((trx) => {
    trx
      .insert({
        hash,
        email,
      })
      .into("login")
      .returning("email")
      .then((logmail) => {
        trx("users")
          .returning("*")
          .insert({
            email,
            name,
            joined: new Date(),
          })
          .then((user) => {
            res.json(user[0]);
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch((err) => res.status(400).json("user present"));
});

// prfile
app.get("/profile/:uid", (req, res) => {
  //   const { uid } = req.params;
  //   if (uid === database.users[0].id) {
  //     res.json(database.users[0]);
  //   } else {
  //     res.json("wrong id");
  //   }
  db.select("*")
    .from("users")
    .where({
      id: uid,
    })
    .then((user) => {
      if (user.length) {
        res.json(user[0]);
      } else {
        res.status(400).json("wrong id");
      }
    })
    .catch((err) => res.json("wrong id"));
});

// image

app.put("/image", (req, res) => {
  const { id } = req.body;
  //   if (id === database.users[0].id) {
  //     database.users[0].entries++;
  //     res.json(database.users[0].entries);
  //   } else {
  //     res.status(400).json("wrong image");
  //   }
  db("users")
    .where("id", "=", id)
    .increment("entries", 1)
    .returning("entries")
    .then((entries) => {
      if (entries.length) {
        res.json(entries[0]);
      } else {
        res.status(400).json("wrong image");
      }
    })
    .catch((err) => res.status(400).json("wrong image"));
});

// calrifai api
const cla = new Clarifai.App({ apiKey: "f846012c64fa41fa91846b6a75ae6dfa" });
app.post("/clarifai", (req, res) => {
  const bodyData = req.body;
  if (bodyData.imgurl) {
    cla.models
      .predict(Clarifai.FACE_DETECT_MODEL, bodyData.imgurl)
      .then((data) => res.json(data))
      .catch((err) => res.status(400).json("error"));
  } else {
    res.status(404).json("error");
  }
});

app.listen(process.env.PORT || 3001, () =>
  console.log("app is running", process.env.PORT)
);
