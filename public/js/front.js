const canvas = document.getElementById('img-canvas');
const context = canvas.getContext('2d');

let image = new Image();
image.src = 'images/circle.jpg';

let horizontalGlyphs = 0;
let verticalGlyphs = 0;

image.addEventListener('load', function(){
    image = scaleImage(20, image);
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);
})

function makeBlackAndWhite() {
    const scannedImage = context.getImageData(0, 0, canvas.width, canvas.height);
    const scannedData = scannedImage.data;
    for (let i = 0; i < scannedData.length; i += 4) {
        const averageColorValue = (scannedData[i] + scannedData[i + 1] + scannedData[i + 2]) / 3
        let newColorValue = 0;
        if (averageColorValue > 127) {
            newColorValue = 255;
        }
        scannedData[i] = newColorValue;
        scannedData[i + 1] = newColorValue;
        scannedData[i + 2] = newColorValue;
    }
    scannedImage.data = scannedData;
    context.putImageData(scannedImage, 0, 0);

    const colorProfiles = [];
    for (let i = 0; i < verticalGlyphs; i++) {
        for (let j = 0; j < horizontalGlyphs; j++) {
            colorProfiles.push(analyzeCell(scannedData, j, i));
            // scannedImage.data = putCell(analyzeCell(scannedData, 0, 0), scannedData, 0, 1);
            // context.putImageData(scannedImage, 0, 0);
        }
    }

    const imageInfo = {
        colorProfiles: colorProfiles,
        horizontalGlyphs: horizontalGlyphs
    };

    fetch('/', {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({imageInfo})
    });
}

function scaleImage(numGlyphs, image) {
    const ratio = image.height / image.width;
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');

    horizontalGlyphs = numGlyphs;
    tempCanvas.width = numGlyphs * 128;
    console.log("Width: " + tempCanvas.width);
    const scaledHeight = ratio * tempCanvas.width;
    console.log("Height: " + scaledHeight);
    verticalGlyphs = Math.round(scaledHeight / 312);
    tempCanvas.height = verticalGlyphs * 312;
    console.log("Rounded height: " + tempCanvas.height);

    tempContext.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height);

    const scaledImage = new Image();
    scaledImage.src = tempCanvas.toDataURL();

    return scaledImage;
}

function analyzeCell(scannedData, horizontalCell, verticalCell){
    const colorProfile = new Array();
    for (let i = 0; i < 312; i += 1) {
        for (let j = 0; j < 128; j += 1) {
            colorProfile.push(scannedData[(i * image.width * 4) + (j * 4) + (horizontalCell * 128 * 4) + (verticalCell * horizontalGlyphs * 312 * 128 * 4)]);
        }
    }
    return colorProfile;
}

function putCell(colorProfile, scannedData, horizontalCell, verticalCell){
    for (let i = 0; i < 312; i += 1) {
        for (let j = 0; j < 128; j += 1) {
            let color = colorProfile[(i * 128) + j];
            let position = (i * image.width * 4) + (j * 4) + (horizontalCell * 128 * 4) + (verticalCell * horizontalGlyphs * 312 * 128 * 4);
            scannedData[position] = color;
            scannedData[position + 1] = color;
            scannedData[position + 2] = color;
            // scannedData[position + 3] = 1;
        }
    }
    return scannedData;
}