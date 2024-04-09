const canvas = document.getElementById("img-canvas");
const context = canvas.getContext("2d");
const slider = document.getElementById("slider");
const sliderText = document.getElementById("slider-width");
const output = document.getElementById("ascii-output");
const canvasCol = document.getElementById("canvas-col");
const imageGenerationButton = document.getElementById(
    "image-generation-button"
);
let image = new Image();
let imageSource = "#";
let canvasImageData = document.getElementById("canvas-image-data");

let horizontalGlyphs = 0;
let verticalGlyphs = 0;
let horizontalGlyphSkipRatio = 1;
let verticalGlyphSkipRatio = 1;

let imageScale = slider.value;

let identifier = Math.floor(Math.random() * 1000);

var drawableCanvas = document.getElementById("drawable-canvas");
document.body.style.margin = 0;
drawableCanvas.style.position = "fixed";

var drawableContext = drawableCanvas.getContext("2d");

var pos = { x: 0, y: 0 };
window.addEventListener("resize", resize);
document.addEventListener("mousemove", draw);
document.addEventListener("mousedown", setPosition);
document.addEventListener("mouseenter", setPosition);

function resize() {
    let tempCanvasImageData = drawableContext.getImageData(
        0,
        0,
        drawableCanvas.width,
        drawableCanvas.height
    );
    drawableCanvas.width = parseFloat(getComputedStyle(canvasCol).width) * 0.7;
    drawableCanvas.height = drawableCanvas.width;
    drawableCanvas.style.position = "relative";
    drawableContext = drawableCanvas.getContext("2d");
    drawableContext.fillStyle = "white";
    drawableContext.fillRect(0, 0, drawableCanvas.width, drawableCanvas.height);
    drawableContext.putImageData(tempCanvasImageData, 0, 0);
}

function setPosition(e) {
    let rect = drawableCanvas.getBoundingClientRect();
    pos.x = e.clientX - rect.left;
    pos.y = e.clientY - rect.top;
}

function draw(e) {
    if (e.buttons !== 1) return;

    drawableContext.beginPath();

    drawableContext.lineWidth = 25;
    drawableContext.lineCap = "round";
    drawableContext.strokeStyle = "black";

    drawableContext.moveTo(pos.x, pos.y);
    setPosition(e);
    drawableContext.lineTo(pos.x, pos.y);

    drawableContext.stroke();
}

window.addEventListener("load", function () {
    resize();
    console.log("Replacing image data");
    if (canvasImageData.getAttribute("src") !== "#") {
        drawableContext.drawImage(canvasImageData, 0, 0);
    }
    if (imageSource !== "#") {
        imageGenerationButton.removeAttribute("disabled");
        image = document.getElementById("img-to-ascii");

        image.src = imageSource;
    }
    document
        .getElementById("image-input")
        .addEventListener("change", function () {
            console.log("File uploaded");
            if (this.files && this.files[0]) {
                imageGenerationButton.removeAttribute("disabled");
                image = document.getElementById("img-to-ascii");

                image.src = URL.createObjectURL(this.files[0]);
                imageSource = image.src;
            }
        });
});

slider.oninput = function () {
    imageScale = this.value;
    sliderText.innerText = imageScale + " characters wide";
};

function clearCanvas() {
    drawableContext.fillStyle = "white";
    drawableContext.fillRect(0, 0, drawableCanvas.width, drawableCanvas.height);
}

function makeBlackAndWhite() {
    let drawnImage = new Image();
    drawnImage.src = drawableCanvas.toDataURL();
    canvasImageData = drawnImage.src;
    image = document.querySelector("img");
    imageSource = image.getAttribute("src");
    image = scaleImage(imageScale, image);
    image.onload = async function () {
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        const scannedImage = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );
        const scannedData = scannedImage.data;
        for (let i = 0; i < scannedData.length; i += 4) {
            const averageColorValue =
                (scannedData[i] + scannedData[i + 1] + scannedData[i + 2]) / 3;
            if (scannedData[i + 3] === 0.0) {
                scannedData[i] = 255;
                scannedData[i + 1] = 255;
                scannedData[i + 2] = 255;
                scannedData[i + 3] = 255;
            } else {
                // Make fully black and white
                let newColorValue = 0;
                if (averageColorValue > 127) {
                    newColorValue = 255;
                }
                scannedData[i] = newColorValue;
                scannedData[i + 1] = newColorValue;
                scannedData[i + 2] = newColorValue;
            }
        }
        scannedImage.data = scannedData;
        context.putImageData(scannedImage, 0, 0);

        const colorProfiles = [];
        for (let i = 0; i < verticalGlyphs; i++) {
            for (let j = 0; j < horizontalGlyphs; j++) {
                let cell = analyzeCell(scannedData, j, i);
                colorProfiles.push(cell);
                // scannedImage.data = putCell(cell, scannedData, j, i);
                // context.putImageData(scannedImage, 0, 0);
            }
        }

        console.log(imageGenerationButton.hasAttribute("disabled"));
        const imageInfo = {
            colorProfiles: colorProfiles,
            horizontalGlyphs: horizontalGlyphs,
            verticalGlyphs: verticalGlyphs,
            horizontalGlyphSkipRatio: horizontalGlyphSkipRatio,
            verticalGlyphSkipRatio: verticalGlyphSkipRatio,
            imageSource: imageSource,
            canvasImageData: canvasImageData,
            generationDisabled: imageGenerationButton.hasAttribute("disabled"),
            id: identifier,
        };

        output.setAttribute("rows", 5);
        output.setAttribute("cols", 20);
        output.innerHTML = "Generating from image...";
        fetch("/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ imageInfo }),
        })
            .then((response) => {
                return response.json();
            })
            .then(async (data) => {
                if (data.status === "success") {
                    window.location.href = `/?id=${identifier}`;
                }
            });
    };
}

function processDrawableCanvas() {
    let drawnImage = new Image();
    drawnImage.src = drawableCanvas.toDataURL();
    canvasImageData = drawnImage.src;

    image = document.querySelector("img");
    imageSource = image.getAttribute("src");

    drawnImage.onload = function () {
        let scaledDrawnImage = scaleImage(imageScale, drawnImage);
        scaledDrawnImage.onload = function () {
            canvas.width = scaledDrawnImage.width;
            canvas.height = scaledDrawnImage.height;
            context.drawImage(scaledDrawnImage, 0, 0);
            const scannedImage = context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );
            const scannedData = scannedImage.data;
            for (let i = 0; i < scannedData.length; i += 4) {
                const averageColorValue =
                    (scannedData[i] + scannedData[i + 1] + scannedData[i + 2]) /
                    3;
                if (scannedData[i + 3] !== 255) {
                    scannedData[i] = 255;
                    scannedData[i + 1] = 255;
                    scannedData[i + 2] = 255;
                    scannedData[i + 3] = 255;
                } else {
                    // Make fully black and white
                    let newColorValue = 0;
                    if (averageColorValue > 127) {
                        newColorValue = 255;
                    }
                    scannedData[i] = newColorValue;
                    scannedData[i + 1] = newColorValue;
                    scannedData[i + 2] = newColorValue;
                }
            }
            scannedImage.data = scannedData;
            context.putImageData(scannedImage, 0, 0);

            const colorProfiles = [];
            for (let i = 0; i < verticalGlyphs; i++) {
                for (let j = 0; j < horizontalGlyphs; j++) {
                    let cell = analyzeCell(scannedData, j, i);
                    colorProfiles.push(cell);
                    // scannedImage.data = putCell(cell, scannedData, j, i);
                    // context.putImageData(scannedImage, 0, 0);
                }
            }

            const imageInfo = {
                colorProfiles: colorProfiles,
                horizontalGlyphs: horizontalGlyphs,
                verticalGlyphs: verticalGlyphs,
                horizontalGlyphSkipRatio: horizontalGlyphSkipRatio,
                verticalGlyphSkipRatio: verticalGlyphSkipRatio,
                imageSource: imageSource,
                canvasImageData: canvasImageData,
                generationDisabled:
                    imageGenerationButton.hasAttribute("disabled"),
                id: identifier,
            };

            output.setAttribute("rows", 5);
            output.setAttribute("cols", 20);
            output.innerHTML = "Generating from drawing...";
            fetch("/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ imageInfo }),
            })
                .then((response) => {
                    return response.json();
                })
                .then(async (data) => {
                    if (data.status === "success") {
                        window.location.href = `/?id=${identifier}`;
                    }
                });
        };
    };
}

function scaleImage(numGlyphs, imageToScale) {
    console.log("Image height: " + imageToScale.height);
    console.log("Image width: " + imageToScale.width);
    const ratio = imageToScale.height / imageToScale.width;
    const tempCanvas = document.createElement("canvas");
    const tempContext = tempCanvas.getContext("2d");

    let originalWidth = imageToScale.width;

    horizontalGlyphs = numGlyphs;
    const scaledHeight = ratio * horizontalGlyphs * 128;
    verticalGlyphs = Math.round(scaledHeight / 312);
    let calculatedHeight = verticalGlyphs * 312;

    horizontalGlyphSkipRatio = roundToNearestWidthFactor(
        (horizontalGlyphs * 128) / originalWidth
    );
    tempCanvas.width = Math.floor(
        (1 / horizontalGlyphSkipRatio) * (horizontalGlyphs * 128)
    );
    verticalGlyphSkipRatio = roundToNearestHeightFactor(
        (verticalGlyphs * 312) /
            ((1 / horizontalGlyphSkipRatio) * calculatedHeight)
    );
    tempCanvas.height = Math.floor(
        (1 / verticalGlyphSkipRatio) * (verticalGlyphs * 312)
    );

    console.log("Horizontal resolution: " + tempCanvas.width);
    console.log("Vertical resolution: " + tempCanvas.height);

    tempContext.drawImage(
        imageToScale,
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
    );

    const scaledImage = new Image();
    scaledImage.src = tempCanvas.toDataURL();

    console.log("Vertical glyphs: " + verticalGlyphs);

    console.log("horizontalGlyphSkipRatio: " + horizontalGlyphSkipRatio);
    console.log("verticalGlyphSkipRatio: " + verticalGlyphSkipRatio);
    return scaledImage;
}

function analyzeCell(scannedData, horizontalCell, verticalCell) {
    const colorProfile = new Array();
    for (let i = 0; i < Math.round(312 / verticalGlyphSkipRatio); i += 1) {
        for (
            let j = 0;
            j < Math.round(128 / horizontalGlyphSkipRatio);
            j += 1
        ) {
            position = Math.round(
                i * ((horizontalGlyphs * 128) / horizontalGlyphSkipRatio) * 4 +
                    j * 4 +
                    horizontalCell * (128 / horizontalGlyphSkipRatio) * 4 +
                    verticalCell *
                        horizontalGlyphs *
                        (312 / verticalGlyphSkipRatio) *
                        (128 / horizontalGlyphSkipRatio) *
                        4
            );
            if ((position + 1) % 4 === 0) {
                position++;
            }
            colorProfile.push(scannedData[position]);
        }
    }
    return colorProfile;
}

function putCell(colorProfile, scannedData, horizontalCell, verticalCell) {
    for (let i = 0; i < Math.round(312 / verticalGlyphSkipRatio); i += 1) {
        for (
            let j = 0;
            j < Math.round(128 / horizontalGlyphSkipRatio);
            j += 1
        ) {
            let color =
                colorProfile[
                    i * Math.round(128 / horizontalGlyphSkipRatio) + j
                ];
            let position = Math.round(
                i * image.width * 4 +
                    j * 4 +
                    horizontalCell * (128 / horizontalGlyphSkipRatio) * 4 +
                    verticalCell *
                        image.width *
                        (312 / verticalGlyphSkipRatio) *
                        4
            );
            while (position % 4 !== 0) {
                position++;
            }
            scannedData[position] = color;
            scannedData[position + 1] = color;
            scannedData[position + 2] = color;
            // scannedData[position + 3] = 1;
        }
    }
    return scannedData;
}

function roundToNearestWidthFactor(number) {
    // let factors = [1, 2, 4, 8, 16, 32, 64, 128];
    let factors = [1, 2, 4, 8, 16];
    let lowestDistance = Number.MAX_SAFE_INTEGER;
    let lowestDistanceFactor = 1;
    factors.forEach((factor) => {
        let distance = Math.abs(number - factor);
        if (distance < lowestDistance) {
            lowestDistance = distance;
            lowestDistanceFactor = factor;
        }
    });
    return lowestDistanceFactor;
}

function roundToNearestHeightFactor(number) {
    // let factors = [1, 2, 3, 4, 6, 8, 12, 13, 24, 26, 39, 52, 78, 104, 156, 312];
    let factors = [1, 2, 3, 4, 6, 8, 12, 13];
    let lowestDistance = Number.MAX_SAFE_INTEGER;
    let lowestDistanceFactor = 1;
    factors.forEach((factor) => {
        let distance = Math.abs(number - factor);
        if (distance < lowestDistance) {
            lowestDistance = distance;
            lowestDistanceFactor = factor;
        }
    });
    return lowestDistanceFactor;
}

function updateOutputTextbox(output) {
    console.log(output);
}
