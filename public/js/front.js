const canvas = document.getElementById('img-canvas');
const context = canvas.getContext('2d');

const image = new Image();
image.src = 'images/line1.png';

image.addEventListener('load', function(){
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

    console.log('Analyzing A')
    const colorProfile = analyzeCell(scannedData, 0);
    for (let i = 0; i < 12; i++) {
        scannedImage.data = putCell(colorProfile, scannedData, i);
        context.putImageData(scannedImage, 0, 0);
    }
}

function analyzeCell(scannedData, cell){
    const colorProfile = new Array();
    for (let i = 0; i < 312; i += 1) {
        for (let j = 0; j < 128; j += 1) {
            colorProfile.push(scannedData[(i * image.width * 4) + (j * 4) + (cell * 128 * 4)]);
        }
    }
    console.log(colorProfile);
    return colorProfile;
}

function putCell(colorProfile, scannedData, cell){
    for (let i = 0; i < 312; i += 1) {
        for (let j = 0; j < 128; j += 1) {
            let color = colorProfile[(i * 128) + j];
            let position = (i * image.width * 4) + (j * 4) + (cell * 128 * 4);
            scannedData[position] = color;
            scannedData[position + 1] = color;
            scannedData[position + 2] = color;
            // scannedData[position + 3] = 1;
        }
    }
    return scannedData;
}