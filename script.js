import defaultLogicEnum from "./logicEnum.js";
import { PathManager } from "./pathManager.js";
import { LogicManager } from "./logicManager.js";
import { makeDraggable } from "./utils.js";
const $ = document.querySelector.bind(document);
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
const MAX_PORT_LIMIT = 10;
let logicEnum = defaultLogicEnum;
const savedLogicEnum = JSON.parse(localStorage.getItem('logics'));
logicEnum = {...logicEnum, ...savedLogicEnum};
const pathManager = new PathManager(pathContainer);
let positionOffset = 0;

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

function toggleState(event) {
    const node = event.target;
    node.setState(!node.state);
}

function createPort(container, options = {}) {
    // if container cannot handle more nodes, then return
    if (container.portCount > MAX_PORT_LIMIT) return;
    // create and empty port
    const div = document.createElement('div');
    div.setState = function(state) {
        if (div.state == state) return;
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
    // by default, all ports will be off
    div.setState(false);
    // if its an input port then we can toggle it
    if (options.canToggle) {
        div.onclick = toggleState;
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

function addLogicsToFooter(currentEnum, template, canDelete) {
    Object.keys(currentEnum).forEach(function(key){
        const logicButton = template.content.cloneNode(true).children[0];
        logicButton.logicName = key;
        logicButton.onclick = function () {
            const newLogicNode = logicNodeTemplate.content.cloneNode(true).children[0];
            newLogicNode.querySelector('.name').innerText = key;
            newLogicNode.logic = new LogicManager(newLogicNode, logicEnum[key]);
            // Provide support to move nodes
            makeDraggable(newLogicNode, logicContainer, '.ports', ()=>{
                positionOffset = 0;
                pathManager.updateConnectedPaths(newLogicNode);
            });
            // Adding Input ports
            const inputCount = currentEnum[key].i;
            newLogicNode.inputs = [];
            for(let i=0;i<inputCount;i++) {
                const port = createPort(newLogicNode.querySelector('.plus'), {
                    onStateChange: () => {
                        newLogicNode.logic.evaluateStates();
                    }
                });
                if (port) {
                    newLogicNode.inputs.push(port);
                }
            }
            // Adding Output ports
            const outputCount = currentEnum[key].o;
            newLogicNode.outputs = [];
            for(let i=0;i<outputCount;i++) {
                const port = createPort(newLogicNode.querySelector('.minus'), {sourcePort: true});
                if (port) {
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
        logicButton.querySelector('.logic-name').innerText = key;
        savedLogics.appendChild(logicButton);
    });
}

function init() {
    const firstPlusPort = createPort(plusBar, {canToggle: true, sourcePort: true});
    plusBar.outputs = [firstPlusPort];
    const firstMinusPort = createPort(minusBar);
    minusBar.inputs = [firstMinusPort];
    addLogicsToFooter(defaultLogicEnum, defaultLogicTemplate);
    addLogicsToFooter(savedLogicEnum, savedLogicTemplate, true);
}
init();