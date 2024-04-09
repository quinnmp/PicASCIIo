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
const usingDB = true;
mongoose.connect(
    `mongodb+srv://miles:${process.env.DB_PASSWORD}@glyphprofiles.9prttyb.mongodb.net/?retryWrites=true&w=majority`
);

const glyphProfileSchema = new mongoose.Schema({
    glyph: String,
    profile: [Number],
});

const GlyphProfile = mongoose.model("GlyphProfile", glyphProfileSchema);

let generatedImages = {};

let glyphProfileArray = new Array();
let comparedProfiles = [];
async function retrieveGlyphProfiles() {
    if (usingDB) {
        try {
            glyphProfileArray = await GlyphProfile.find({}).exec();

            // Pre-process glyph profiles for faster access
            comparedProfiles = glyphProfileArray.map(
                (element) => element.profile
            );
        } catch (e) {
            console.log(e);
        }
    }
}

retrieveGlyphProfiles().then(() => {
    app.get("/", function (req, res) {
        let generatedImage = generatedImages[req.query.id];
        if (!generatedImage) {
            generatedImage = {
                output: "",
                rows: 5,
                cols: 20,
                imageSource: "#",
                canvasImageData: "#",
                generationDisabled: true,
                horizontalGlyphs: 20,
            };
        }
        console.log(generatedImage.imageSource);
        res.render("index", generatedImage);
    });

    app.post("/", function (req, res) {
        // const glyphProfile = new GlyphProfile ({
        //     glyph: req.body.glyph,
        //     profile: req.body.profile
        // });

        // glyphProfile.save();
        console.log("POST /");
        let outputText = "";
        let rows = 5;
        let cols = 20;

        let imageSource = "#";
        let canvasImageData = "#";
        let generationDisabled = true;
        let horizontalGlyphs = 20;

        const imageInfo = req.body.imageInfo;
        const profiles = imageInfo.colorProfiles;
        horizontalGlyphs = imageInfo.horizontalGlyphs;
        cols = horizontalGlyphs;
        const horizontalGlyphSkipRatio = imageInfo.horizontalGlyphSkipRatio;
        const verticalGlyphSkipRatio = imageInfo.verticalGlyphSkipRatio;
        const verticalGlyphs = imageInfo.verticalGlyphs;
        rows = verticalGlyphs;
        imageSource = imageInfo.imageSource;
        canvasImageData = imageInfo.canvasImageData;
        generationDisabled = imageInfo.generationDisabled;

        outputText = "";

        // Pre-calculate the positions used in the loops
        const positionCache = {};
        for (let i = 0; i < profiles[0].length; i++) {
            positionCache[i] =
                Math.floor((i * horizontalGlyphSkipRatio) / 128) *
                (verticalGlyphSkipRatio * 128);
        }

        for (
            let profileIndex = 0;
            profileIndex < profiles.length;
            profileIndex++
        ) {
            const profileElement = profiles[profileIndex];
            let lowestDifference = Number.MAX_SAFE_INTEGER;
            let lowestDifferenceGlyph = "";
            let skipComparisons = false;

            // Check against blank symbol
            const comparedProfile = comparedProfiles[94];

            let differences = 0;
            for (let i = 0; i < profileElement.length; i++) {
                const position = positionCache[i];
                differences += Math.abs(
                    profileElement[i] -
                        comparedProfile[
                            position + ((i * horizontalGlyphSkipRatio) % 128)
                        ]
                );
            }
            if (differences === 0) {
                lowestDifferenceGlyph = " ";
                skipComparisons = true;
            } else if (differences / profileElement.length === 255) {
                lowestDifferenceGlyph = "#";
                skipComparisons = true;
            }

            if (!skipComparisons) {
                for (
                    let glyphIndex = 0;
                    glyphIndex < comparedProfiles.length;
                    glyphIndex++
                ) {
                    const comparedProfile = comparedProfiles[glyphIndex];

                    differences = 0;
                    for (let i = 0; i < profileElement.length; i++) {
                        const position = positionCache[i];
                        differences += Math.abs(
                            profileElement[i] -
                                comparedProfile[
                                    position +
                                        ((i * horizontalGlyphSkipRatio) % 128)
                                ]
                        );
                    }
                    if (
                        differences < lowestDifference ||
                        (differences === lowestDifference &&
                            lowestDifferenceGlyph === "_")
                    ) {
                        lowestDifference = differences;
                        lowestDifferenceGlyph =
                            glyphProfileArray[glyphIndex].glyph;
                    }
                }
            }
            if (profileIndex % horizontalGlyphs === 0 && profileIndex > 0) {
                outputText += "\n";
            }
            outputText += lowestDifferenceGlyph;
        }

        generatedImages[imageInfo.id] = {
            output: outputText,
            rows: rows,
            cols: cols,
            imageSource: imageSource,
            canvasImageData: canvasImageData,
            generationDisabled: generationDisabled,
            horizontalGlyphs: horizontalGlyphs,
        };
        res.send(JSON.stringify({ status: "success" }));
    });

    app.listen(process.env.PORT || 8008, function () {
        console.log("Server started on port 8008.");
    });
});
