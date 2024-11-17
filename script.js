logger(true);
const objectCollection = new ObjectManager();
const refEnum = {
    ADD_INPUT: 0,
    ADD_OUTPUT: 1
}

function createBar(text, x, y, state = true) {
    const width = 150;
    const height = 50;
    addTextBox({
        x,
        y,
        width,
        height,
        color: 'lightgrey',
        text,
    });
    addLine({
        fromX: x + width/2,
        fromY: y + 50,
        toX: x + width/2,
        toY: 600,
        width: 10,
        color: state ? 'red' : 'grey',
    });
    objectCollection.addObject({
        x,
        y,
        ref: state ? refEnum.ADD_INPUT : refEnum.ADD_OUTPUT
    })
}

function setup() {
    createCanvas(1400, 700, document.querySelector('#container'));
    setFont('20px', 'sans-serif');
    createBar('Add Input', 100, 100);
    createBar('Add Output', 1100, 100, false);
}

function onCanvasClick(x, y) {
    const target = objectCollection.getObject(x,y);
    if (target == refEnum.ADD_INPUT) {
        console.log('input');
    } else if (target == refEnum.ADD_OUTPUT) {
        console.log('output');
    }
}