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
  
retrieveGlyphProfiles().then(() => {
    app.set("view engine", "ejs");
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json({ limit: "500mb" }));
    app.use(express.static("public"));

    app.get("/", function(req, res) {
        res.render("index");
    });

    app.post("/", function(req, res) {
        console.log("Post request recieved");
        // const glyphProfile = new GlyphProfile ({
        //     glyph: req.body.glyph,
        //     profile: req.body.profile
        // });

        // glyphProfile.save();
        const profiles = req.body.imageInfo.colorProfiles;
        const horizontalGlyphs = req.body.imageInfo.horizontalGlyphs;

        profiles.forEach((profileElement, index) => {
            let highestSimilarity = 0;
            let highestSimilarityGlyph = '';
            glyphProfileArray.forEach(element => {
                const comparedProfile = element.profile;
        
                let similarities = 0;
                for (let i = 0; i < profileElement.length; i++) {
                    if (profileElement[i] === comparedProfile[i]) {
                        similarities++;
                    }
                }
        
                // console.log("Glyph similarity to " + element.glyph + ": " + similarities / profileElement.length);
                if (similarities > highestSimilarity) {
                    highestSimilarity = similarities;
                    highestSimilarityGlyph = element.glyph;
                }
            });
            if((index % horizontalGlyphs) === 0 && index > 0) {
                console.log();
            }
            process.stdout.write(highestSimilarityGlyph);
        })
        console.log();

        res.redirect("/");
    });

    app.listen(process.env.PORT || 8008, function() {
        console.log("Server started.");
    });
})