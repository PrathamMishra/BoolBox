let looping = true;
let shouldLog = false;
let maxFrames = Infinity;
let frameCount = 0;
let startTime;
var width = -1;
var height = -1;
let ctx;
let canvas;
let showingFrameRate = false;
let frameRateElement;

function createCanvas(canvasWidth, canvasHeight, parent = document.body) {
    canvas = canvas || document.createElement("canvas");
    ctx = canvas.getContext("2d");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    width = canvasWidth;
    height = canvasHeight;
    parent.appendChild(canvas);
    setFont('20px', 'sans-serif');
    if (canvas) {
        canvas.addEventListener('click', (event)=>{
            let x = event.clientX - canvas.getBoundingClientRect().left;
            let y = event.clientY - canvas.getBoundingClientRect().top;
            window.onCanvasClick && onCanvasClick(x, y);
        });
        canvas.addEventListener('mousedown', (event)=>{
            let x = event.clientX - canvas.getBoundingClientRect().left;
            let y = event.clientY - canvas.getBoundingClientRect().top;
            window.onCanvasMouseDown && onCanvasMouseDown(x, y);
        });
        canvas.addEventListener('mousemove', (event)=>{
            let x = event.clientX - canvas.getBoundingClientRect().left;
            let y = event.clientY - canvas.getBoundingClientRect().top;
            window.onCanvasMouseMove && onCanvasMouseMove(x, y);
        });
        canvas.addEventListener('mouseup', (event)=>{
            let x = event.clientX - canvas.getBoundingClientRect().left;
            let y = event.clientY - canvas.getBoundingClientRect().top;
            window.onCanvasMouseUp && onCanvasMouseUp(x, y);
        });
    }
}

function updateCanvas(canvasWidth, canvasHeight) {
    if (width === canvasWidth && height === canvasHeight) return;
    width = canvasWidth;
    height = canvasHeight;
    canvas.width = width;
    canvas.height = height;
}

function setAlpha(alpha) {
    ctx.globalAlpha = alpha;
}

function lerp(a, b, alpha) {
    return a + alpha * (b - a);
}

function filledRect(x, y, width, height, color){
    const prevFill = ctx.fillStyle;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
    ctx.fillStyle = prevFill;

}

function addTextBox({x, y, width, height, color, text, textColor}) {
    filledRect(x, y, width, height, color);
    const fontSize = Number(ctx.font.split(' ')[0].replace(/px/g, ''));
    addText({
        x: x + width/2 - (fontSize*text.length)/4,
        y: y + height/2 + fontSize/3,
        text,
        textColor
    });
}

function addText({x, y, text, textColor}) {
    const prevFill = ctx.fillStyle;
    ctx.fillStyle = textColor;
    ctx.fillText(text, x, y);
    ctx.fillStyle = prevFill;
}

function setFont(size, family) {
    ctx.font = `${size} ${family}`;
}

function rect(x, y, width, height, color, lineWidth){
    const prevStrokeColor = ctx.strokeStyle;
    const prevStrokeWidth = ctx.lineWidth;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.closePath();
    ctx.strokeStyle = prevStrokeColor;
    ctx.lineWidth = prevStrokeWidth;
}

function addLine({fromX, fromY, toX, toY, width, color}) {
    const prevStrokeColor = ctx.strokeStyle;
    const prevStrokeWidth = ctx.lineWidth;
    ctx.beginPath(fromX, fromY);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.closePath();
    ctx.strokeStyle = prevStrokeColor;
    ctx.lineWidth = prevStrokeWidth;
}

function background(r, g = r, b = r) {
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fill();
    ctx.closePath();
}

function grid(rows, cols) {
  let dimensionX = width / cols;
  let dimensionY = height / rows;
    for (let currX = 0; currX < width; currX += dimensionX) {
        for (let currY = 0; currY < height; currY += dimensionY) {
            ctx.beginPath();
            ctx.rect(currX, currY, dimensionX, dimensionY);
            ctx.stroke();
            ctx.closePath();
        }
    }
}

function noLoop() {
  looping = false;
}

function loop() {
    if (looping) return;
    looping = true;
    runframe();
}

function logger(state) {
    shouldLog = state;
}

function overrideLogger() {
    const prevLog = console.log;
    console.log = function () {
        if (shouldLog) {
            prevLog.apply(this, arguments);
        }
    }
}
overrideLogger();

function createFrameRateElement(){
    frameRateElement = document.createElement('h3');
    frameRateElement.style.color = 'green';
    frameRateElement.style.position = 'fixed';
    frameRateElement.style.top = '10px';
    frameRateElement.style.right = '10px';
    document.body.appendChild(frameRateElement);
}

function runframe() {
    frameCount++;
    startTime = startTime || new Date();
    if (showingFrameRate) {
        frameRateElement.innerText = Math.floor(frameCount/((new Date() - startTime)/1000));
        frameRateElement.style.display = 'block';
    } else {
        frameRateElement.style.display = 'none';
    }
    window.update && update();
    if (looping && window.update && (frameCount < maxFrames)) {
        window.requestAnimationFrame(runframe);
    }
}

function showFrameRate() {
    showingFrameRate = true;
}

function restart() {
    looping = true;
    shouldLog = false;
    maxFrames = Infinity;
    frameCount = 0;
    width = -1;
    height = -1;
    showingFrameRate = false;
    startTime = null;
    window.setup && window.setup();
}

function hideFrameRate() {
    showingFrameRate = false;
}

function addEventListeners() {
    document.addEventListener('keydown', (event)=>{
        onKeyPress && onKeyPress(event.key);
    });
}

window.addEventListener("load", function () {
    window.setup && setup();
    console.log("Setup Complete");
    addEventListeners();
    createFrameRateElement();
    if (looping) {
        runframe();
    }
});

if (document.readyState == 'complete') {
    window.setup && setup();
    console.log("Setup Complete");
    addEventListeners();
    createFrameRateElement();
    if (looping) {
        runframe();
    }
}