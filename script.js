import defaultLogicEnum from "./logicEnum.js";
import { PathManager } from "./pathManager.js";
import { LogicManager } from "./logicManager.js";
import { charFromNum, makeDraggable } from "./utils.js";
const $ = document.querySelector.bind(document);
const saveBtn = $('#save-btn');
const saveInput = $('#save-input');
const latencyInput = $('#latency-input');
const tableBtn = $('#table-btn');
const modalContainer = $('#modal-container');
const modalContent = $('#modal-content');
const closeModalbtn = $('#modal-close-btn');
const modalBg = $('#modal-background');
const plusContainer = $('.bar-container.plus');
const minusContainer = $('.bar-container.minus');
const plusBar = plusContainer.querySelector('#bar');
const minusBar = minusContainer.querySelector('#bar');
const savedLogics = $('#saved-logics');
const logicContainer = $('#logic-container');
const pathContainer = $('#path-container');
const savedLogicTemplate = $('#saved-logic-template');
const defaultLogicTemplate = $('#default-logic-template');
const logicNodeTemplate = $('#logic-node-template');
const tableTemplate = $('#table-template');
let blazeMode = false; // sets states without delays
const MAX_PORT_LIMIT = 8;
let logicEnum = defaultLogicEnum;
const savedLogicEnum = JSON.parse(localStorage.getItem('logics')) || {};
logicEnum = {...logicEnum, ...savedLogicEnum};
const pathManager = new PathManager(pathContainer);
let positionOffset = 0;
let tableTimeout;
let inputState;

plusContainer.addEventListener('click', function(e) {
    if (e.target.closest('button')) {
        const port = createPort(plusBar, {canToggle: true, sourcePort: true});
        if (port) {
            plusBar.outputs.push(port);
            pathManager.updateConnectedPaths(plusBar);
        }
        return;
    }
});

minusContainer.addEventListener('click', function(e) {
    if (e.target.closest('button')) {
        const port = createPort(minusBar);
        if (port) {
            minusBar.inputs.push(port);
            pathManager.updateConnectedPaths(minusBar);
        }
        return;
    }
});

saveBtn.addEventListener('click', ()=>{
    if (!saveInput.value) {
        saveInput.classList.add('empty');
        return;
    }
    const logicName = saveInput.value;
    const logicData = {
        i: plusBar.portCount,
        o: minusBar.portCount,
        logics: new Array(minusBar.portCount).fill('?')
    };
    for (let i=0; i<logicData.o; i++) {
        logicData.logics[i] = LogicManager.deriveLogic(minusBar.inputs[i]);
    }
    savedLogicEnum[logicName] = logicData;
    localStorage.setItem('logics', JSON.stringify(savedLogicEnum));
    logicEnum[logicName] = logicData;
    addLogic(logicName, logicData, savedLogicTemplate, true);
    saveInput.classList.remove('empty');
});

tableBtn.addEventListener('click', () => {
    const inputCount = plusBar.outputs.length;
    const outputCount = minusBar.inputs.length;
    // set input states so that they can be reconfigured when closing modal
    inputState = new Array(inputCount);
    const ports = plusBar.outputs;
    for (let i=0;i<ports.length;i++) {
        inputState[i] = ports[i].state;
    }
    const table = tableTemplate.content.cloneNode(true).children[0];
    const inputTableHeader = table.querySelector('#input-header');
    const outputTableHeader = table.querySelector('#output-header');
    const tableBody = table.querySelector('tbody');
    const labelRow = table.querySelector('#label-row');
    // Set Input Headers
    inputTableHeader.setAttribute('colspan', inputCount);
    for (let i=0;i<inputCount;i++) {
        const label = charFromNum(i, true);
        const cell = document.createElement('th');
        cell.innerText = label;
        labelRow.appendChild(cell);
    }
    // Set Output Headers
    outputTableHeader.setAttribute('colspan', outputCount);
    for (let i=0;i<outputCount;i++) {
        const label = charFromNum(i, true);
        const cell = document.createElement('th');
        cell.innerText = label + '\'';
        labelRow.appendChild(cell);
    }
    modalContent.appendChild(table);
    toggleModal();
    let combinations = Math.pow(2, inputCount);
    function calculateRow(id) {
        if (id >= combinations) return;
        const row = document.createElement('tr');
        let num = id;
        // Set Inputs
        for (let j=inputCount - 1;j >= 0;j--) {
            const bit = num % 2;
            num = num >> 1;
            const port = plusBar.outputs[j];
            try {
                port.setState(bit);
            } catch (e) {
                // some error in setting the state
                // probably an infinite loop from feedback logic
            }
            const cell = document.createElement('td');
            cell.innerText = bit;
            row.prepend(cell);
        }
        for (let j=0;j < outputCount;j++) {
            const port = minusBar.inputs[j];
            const cell = document.createElement('td');
            cell.innerText = +port.state;
            row.append(cell);
        }
        tableBody.appendChild(row);
        tableTimeout = setTimeout(()=>calculateRow(id+1), 250);
    }
    calculateRow(0);
});

// Hide Modal when user clicks close btn or bg
closeModalbtn.addEventListener('click', ()=>{
    toggleModal();
});
modalBg.addEventListener('click', ()=>{
    toggleModal();
});

function toggleModal() {
    const state = modalContainer.style.display;
    if (state=='none') {
        blazeMode = true;
        modalContainer.style.display = '';
    } else {
        blazeMode = false;
        // Set original state
        if (inputState) {
            const ports = plusBar.outputs;
            for (let i=0;i<ports.length;i++) {
                ports[i].setState(inputState[i]);
            }
            inputState = null;
        }
        if (tableTimeout) clearTimeout(tableTimeout);
        // There can be an edge case where more than one table appears (not replicable)
        document.querySelectorAll('#logicTable').forEach((table)=>table.remove());
        modalContainer.style.display = 'none';
    }
}

function toggleState(event) {
    const node = event.target;
    node.setState(!node.state, true);
}

function updateState(div, state, options) {
    div.state = state;
    if (state == true) {
        div.classList.remove('off');
    } else {
        div.classList.add('off');
    }
    // update states of all connected sink ports
    pathManager.getConnectedSinkPorts(div).forEach((sinkPort)=>{
        sinkPort.setState(state);
    });
    options.onStateChange && options.onStateChange(div);
}

function createPort(container, options = {}) {
    // if container cannot handle more nodes, then return
    if (container.portCount > MAX_PORT_LIMIT) return;
    // create and empty port
    const div = document.createElement('div');
    div.setState = function(state, force = false) {
        if (div.state == state) return;
        // immediately update state if blaze mode
        if (force || blazeMode) updateState(div, state, options);
        // delay forward
        setTimeout(()=>{
            updateState(div, state, options);
        }, 100 * latencyInput.value);
    }
    // by default, all ports will be off
    div.setState(false, true);
    // if its an input port then we can toggle it
    if (options.canToggle) {
        div.onclick = toggleState;
        div.originPort = true;
    }
    if (options.sourcePort) {
        pathManager.addSourcePort(div);
    } else {
        pathManager.addSinkPort(div);
    }
    container.portCount = 1 + Number(container.portCount || 0);
    container.appendChild(div);
    return div;
}

function deleteLogic(event) {
    const node = event.target.parentNode;
    event.stopPropagation();
    delete logicEnum[node.logicName];
    delete savedLogicEnum[node.logicName];
    localStorage.setItem('logics', JSON.stringify(savedLogicEnum));
    savedLogics.removeChild(node);
}

function addLogic(logicName, logicData, template, canDelete) {
    const logicButton = template.content.cloneNode(true).children[0];
    logicButton.logicName = logicName;
    logicButton.onclick = function () {
        const newLogicNode = logicNodeTemplate.content.cloneNode(true).children[0];
        newLogicNode.querySelector('.name').innerText = logicName;
        newLogicNode.logicName = logicName;
        newLogicNode.logicData = logicData;
        newLogicNode.logic = new LogicManager(newLogicNode, logicData);
        // Provide support to move nodes
        makeDraggable(newLogicNode, logicContainer, '.ports', ()=>{
            positionOffset = 0;
            pathManager.updateConnectedPaths(newLogicNode);
        });
        // Adding Input ports
        const inputCount = logicData.i;
        newLogicNode.inputs = [];
        for(let i=0;i<inputCount;i++) {
            const port = createPort(newLogicNode.querySelector('.plus'), {
                onStateChange: () => {
                    newLogicNode.logic.evaluateStates();
                }
            });
            if (port) {
                port.logicNode = newLogicNode;
                newLogicNode.inputs.push(port);
            }
        }
        // Adding Output ports
        const outputCount = logicData.o;
        newLogicNode.outputs = [];
        for(let i=0;i<outputCount;i++) {
            const port = createPort(newLogicNode.querySelector('.minus'), {sourcePort: true});
            if (port) {
                port.logicNode = newLogicNode;
                newLogicNode.outputs.push(port);
            }
        }
        // Evaluate States for first time
        newLogicNode.logic.evaluateStates();
        // Calculate height of container according to max port count
        newLogicNode.style.height = `calc(${Math.max(inputCount, outputCount)}*24px)`;
        // add elements with some offset so that they don't overlap
        newLogicNode.style.top = 150 + positionOffset + 'px';
        newLogicNode.style.left = 150 + positionOffset + 'px';
        positionOffset += 15;
        logicContainer.appendChild(newLogicNode);
    }
    if (canDelete) {
        const deleteIcon = logicButton.querySelector('.fa-trash');
        deleteIcon.onclick = deleteLogic;
    }
    logicButton.querySelector('.logic-name').innerText = logicName;
    savedLogics.appendChild(logicButton);
}

function addLogicsToFooter(currentEnum, template, canDelete) {
    Object.entries(currentEnum).forEach(function([logicName, logicData]){
        addLogic(logicName, logicData, template, canDelete)
    });
}

function addLogicsOnFooter() {
    addLogicsToFooter(defaultLogicEnum, defaultLogicTemplate);
    addLogicsToFooter(savedLogicEnum, savedLogicTemplate, true);
}

function init() {
    const firstPlusPort = createPort(plusBar, {canToggle: true, sourcePort: true});
    plusBar.outputs = [firstPlusPort];
    const firstMinusPort = createPort(minusBar);
    minusBar.inputs = [firstMinusPort];
    addLogicsOnFooter();
    logicContainer.addEventListener('contextmenu', event => event.preventDefault());

}
init();