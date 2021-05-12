const express = require("express");
const app = express();
const cors = require("cors");
const bcrypt = require("bcrypt");
const mongodb = require("mongodb");
const { connect } = require("http2");
const jwt = require("jsonwebtoken");
require("dotenv").config

const URL = process.env.DB;
const DB = "url";

app.use(cors());
app.use(express.json());

app.listen(process.env.PORT || 8080, function () {
  console.log("server is running");
});

app.post("/register", async function (req, res) {
  try {
    // connect to DB
    let connection = await mongodb.connect(URL);
    // select db
    let db = connection.db(DB);
    // checking if email is already present
    let isEmailUnique = await db
      .collection("register")
      .findOne({ userEmail: req.body.userEmail });
    if (isEmailUnique) {
      res.status(401).json({
        message: "Email is Already present",
      });
    } else {
      let salt = await bcrypt.genSalt(10);
      let hash = await bcrypt.hash(req.body.userPassword, salt);
      req.body.userPassword = hash;
      let users = await db.collection("register").insertOne(req.body);
      await connection.close();
      res.json({
        message: "User Registered",
      });
    }
  } catch (error) {
    console.log(error);
  }
});
app.get("/register", async function (req, res) {
  try {
    // connect to DB
    let connection = await mongodb.connect(URL);
    // select db
    let db = connection.db(DB);
    
    if(db){
      res.json({
        message:"in"
      })}
      else{
        res.json({
          message:"out"  
      })   
  } }catch (error) {
    console.log(error);
  }
});

app.post("/login", async function (req, res) {
  try {
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    // crud

    let user = await db
      .collection("register")
      .findOne({ userEmail: req.body.userEmail });

    if (user) {
      let isPasswordCorrect = await bcrypt.compare(
        req.body.userPassword,
        user.userPassword
      );

      if (isPasswordCorrect) {
        let token = jwt.sign({ _id: user._id },process.env.SECRET);
        res.json({
          message: "allow",
          token,
          id: user._id,
        });
      } else {
        res.status(404).json({
          message: "Email or Password is incorrect",
        });
      }
    } else {
      res.status(404).json({
        message: "Email or Password is incorrect",
      });
    }
    await connection.close();
  } catch (error) {
    console.log(error);
  }
});

function authenticate(req, res, next) {
  if (req.headers.authorization) {
    try {
      let jwtvalid = jwt.verify(req.headers.authorization,process.env.SECRET);
      if (jwtvalid) {
        req.userid = jwtvalid._id;
        next();
      }
    } catch (error) {
      res.status(401).json({
        message: "invalid Token",
      });
    }
  } else {
    res.status(401).json({
      message: "No Token",
    });
  }
}
app.post("/urlshortner/:id", authenticate, async function (req, res) {
  try {
    let id = req.params.id;
    let longUrl = req.body.longUrl;
    let shortUrl = shrturl();
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    let url = await db
      .collection("url")
      .insertOne({ usrid: req.params.id, longUrl, shortUrl });
  } catch (error) {
    console.log(error);
  }
  res.json({
    message: "url added",
  });
});
function shrturl() {
  let rndresult = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charlen = characters.length;
  for (let i = 0; i < 5; i++) {
    rndresult += characters.charAt(Math.floor(Math.random() * charlen));
  }
  return rndresult;
}

app.get("/:urlId", async (req, res) => {
  try {
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    let response = await db
      .collection("url")
      .find({ shortUrl: req.params.urlId })
      .toArray();
    // console.log(response[0].longUrl);
    res.redirect(response[0].longUrl);
  } catch (error) {
    console.log(error);
  }
});
app.get("/urlshortner/:id", authenticate, async (req, res) => {
  try {
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    let user = await db
      .collection("url")
      .find({ usrid: req.params.id })
      .toArray();
    console.log(user);
    await connection.close();
    res.json(user);
  } catch (error) {
    console.log(error);
  }
});
