require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "500mb" }));
app.use(express.static("public"));

const usingDB = false;
mongoose.connect(
    `mongodb+srv://miles:${process.env.DB_PASSWORD}@glyphprofiles.9prttyb.mongodb.net/?retryWrites=true&w=majority`
);

const glyphProfileSchema = new mongoose.Schema({
    glyph: String,
    profile: [Number],
});

const GlyphProfile = mongoose.model("GlyphProfile", glyphProfileSchema);

let glyphProfileArray = new Array();
async function retrieveGlyphProfiles() {
    if (usingDB) {
        try {
            glyphProfileArray = await GlyphProfile.find({}).exec();
        } catch (e) {
            console.log(e);
        }
    }
}

retrieveGlyphProfiles().then(() => {
    let outputText = "";
    let rows = 5;
    let cols = 20;

    let imageSource = "#";
    let canvasImageData = "#";

    app.get("/", function (req, res) {
        res.render("index", {
            output: outputText,
            rows: rows,
            cols: cols,
            imageSource: imageSource,
            canvasImageData: canvasImageData,
        });
    });

    app.post("/", function (req, res) {
        // const glyphProfile = new GlyphProfile ({
        //     glyph: req.body.glyph,
        //     profile: req.body.profile
        // });

        // glyphProfile.save();
        const profiles = req.body.imageInfo.colorProfiles;
        const horizontalGlyphs = req.body.imageInfo.horizontalGlyphs;
        cols = horizontalGlyphs;
        const verticalGlyphs = req.body.imageInfo.verticalGlyphs;
        rows = verticalGlyphs;
        const horizontalGlyphSkipRatio =
            req.body.imageInfo.horizontalGlyphSkipRatio;
        const verticalGlyphSkipRatio =
            req.body.imageInfo.verticalGlyphSkipRatio;
        imageSource = req.body.imageInfo.imageSource;
        canvasImageData = req.body.imageInfo.canvasImageData;

        outputText = "";
        profiles.forEach((profileElement, index) => {
            let lowestDifference = Number.MAX_SAFE_INTEGER;
            let lowestDifferenceGlyph = "";
            glyphProfileArray.forEach((element) => {
                const comparedProfile = element.profile;

                let differences = 0;
                for (let i = 0; i < profileElement.length; i++) {
                    let position =
                        Math.floor((i * horizontalGlyphSkipRatio) / 128) *
                        (verticalGlyphSkipRatio * 128);
                    // console.log('Profile element ' + profileElement[i]);
                    // console.log('Compared element ' + comparedProfile[position + ((i * horizontalGlyphSkipRatio) % 128)]);
                    differences += Math.abs(
                        profileElement[i] -
                            comparedProfile[
                                position +
                                    ((i * horizontalGlyphSkipRatio) % 128)
                            ]
                    );
                }

                // console.log('Glyph similarity to ' + element.glyph + ': ' + similarities / profileElement.length);
                if (
                    differences < lowestDifference ||
                    (differences === lowestDifference &&
                        lowestDifferenceGlyph === "_")
                ) {
                    lowestDifference = differences;
                    lowestDifferenceGlyph = element.glyph;
                }
            });
            if (index % horizontalGlyphs === 0 && index > 0) {
                outputText = outputText.concat("\n");
            }
            outputText = outputText.concat(lowestDifferenceGlyph);
        });
        console.log(outputText);
    });

    app.listen(process.env.PORT || 8008, function () {
        console.log("Server started.");
    });
});
