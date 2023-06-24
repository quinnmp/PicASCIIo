require("dotenv").config();
const ejs = require("ejs");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

mongoose.connect(`mongodb+srv://miles:${process.env.DB_PASSWORD}@glyphprofiles.9prttyb.mongodb.net/?retryWrites=true&w=majority`)

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
        const horizontalGlyphSkipRatio = req.body.imageInfo.horizontalGlyphSkipRatio;
        const verticalGlyphSkipRatio = req.body.imageInfo.verticalGlyphSkipRatio;

        profiles.forEach((profileElement, index) => {
            let highestSimilarity = 0;
            let highestSimilarityGlyph = '';
            glyphProfileArray.forEach(element => {
                const comparedProfile = element.profile;
        
                let similarities = 0;
                for (let i = 0; i < profileElement.length; i++) {
                    let position = Math.floor((i * horizontalGlyphSkipRatio) / 128) * (verticalGlyphSkipRatio * 128);
                    // console.log("Profile element " + profileElement[i]);
                    // console.log("Compared element " + comparedProfile[position + ((i * horizontalGlyphSkipRatio) % 128)]);
                    if (profileElement[i] === comparedProfile[position + ((i * horizontalGlyphSkipRatio) % 128)]) {
                        similarities++;
                    }
                }
        
                // console.log("Glyph similarity to " + element.glyph + ": " + similarities / profileElement.length);
                if (similarities > highestSimilarity || (similarities === highestSimilarity && highestSimilarityGlyph === "_")) {
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