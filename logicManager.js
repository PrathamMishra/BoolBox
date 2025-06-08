import { charFromNum, numFromChar } from "./utils.js";

export class LogicManager {
    node;
    logicData;

    constructor(node, logicData) {
        this.node = node;
        this.logicData = logicData;
    }

    evaluateStates() {
        for (let i=0; i < this.node.outputs?.length;i++) {
            const inputStates = this.node.inputs.map((port)=>port.state);
            const outputPort = this.node.outputs[i];
            outputPort.setState(this.evaluateLogicTree(inputStates, this.logicData.logics[i]), true);
        }
    }

    evaluateLogicTree(inputs, logicString) {
        let logic = logicString.split('');
        let i = 0;
        let stack = [];
        while (i < logic.length) {
            if (/[!&\(]/.test(logic[i])) {
                stack.unshift(logic[i]);
            } else {
                let output;
                if (logic[i] === ')') {
                    output = stack.shift();
                    // Remove Opening Brackets
                    stack.shift();
                } else {
                    const index = numFromChar(logic[i]);
                    output = inputs[index];
                }
                // ReEvaluate Tree Until previous bracket
                while (stack.length && stack[0] !== '(') {
                    const val = stack.shift();
                    if (val == '!') {
                        output = !output;
                    } else if (val == '&') {
                        const firstVal = stack.shift();
                        output = firstVal && output;
                    }
                }
                // push current data again
                stack.unshift(output);
            }
            i++;
        }
        return Boolean(stack[0]);
    }

    static deriveLogic(port, map = new Map()) {
        if (map.has(port)) {
            return map.get(port);
        }
        let str = '';
        try {
            const sourcePort = port.sinkingPath?.source;
            if (sourcePort.originPort) {
                const bar = sourcePort.parentNode;
                const index = bar.outputs.indexOf(sourcePort);
                return index == -1 ? '?' : charFromNum(index);
            }
            const logicNode = sourcePort.logicNode;
            const index = logicNode.outputs.indexOf(sourcePort);
            const logic = logicNode.logicData?.logics[index];
            // Replace all inputs with their corresponding logics
            str = logic.replace(/[^!()&?]/g, function(input) {
                const index = numFromChar(input);
                const inputPort = logicNode.inputs[index];
                const inputLogic = LogicManager.deriveLogic(inputPort, map);
                return `(${inputLogic})`;
            });
        } catch (e) {
            console.log('Some error in deriving logic:', e); // callstack exceeded in case of feedback loop
            str = '?';
        }
        map.set(port, str);
        return str;
    }
}