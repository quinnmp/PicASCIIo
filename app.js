require("dotenv").config();
const ejs = require("ejs");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

mongoose.connect(`mongodb+srv://miles:${process.env.DB_PASSWORD}@glyphprofiles.r0wfe5p.mongodb.net/?retryWrites=true&w=majority`)

const glyphProfileSchema = new mongoose.Schema ({
    glyph: String,
    profile: [Number]
})

const GlyphProfile = mongoose.model("GlyphProfile", glyphProfileSchema);

let glyphProfileArray = new Array;
async function retrieveGlyphProfiles() {
    try {
      glyphProfileArray = await GlyphProfile.find({}).exec();
    } catch (e) {
      console.log(e);
    }
}
  
retrieveGlyphProfiles();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.static("public"));

app.get("/", function(req, res) {
    res.render("index");
});

app.post("/", function(req, res) {
    // const glyphProfile = new GlyphProfile ({
    //     glyph: req.body.glyph,
    //     profile: req.body.profile
    // });

    // glyphProfile.save();
    const profile = req.body.profile;

    glyphProfileArray.forEach(element => {
        const comparedProfile = element.profile;

        let similarities = 0;
        for (let i = 0; i < profile.length; i++) {
            if (profile[i] === comparedProfile[i]) {
                similarities++;
            }
        }

        console.log("Glyph similarity to " + element.glyph + ": " + similarities / profile.length);
    });

    res.redirect("/");
});

app.listen(process.env.PORT || 8008, function() {
    console.log("Server started.");
});