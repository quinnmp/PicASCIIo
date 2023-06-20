require("dotenv").config();
const ejs = require("ejs");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", function(req, res) {
    res.render("index");
  });

app.listen(process.env.PORT || 8008, function() {
    console.log("Server started.");
  });