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
            outputPort.setState(this.evaluateLogicTree(inputStates, this.logicData.logics[i]));
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
                    const index = this.numFromChar(logic[i]);
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
        return stack[0];
    }

    numFromChar(char) {
        return char.charCodeAt(0) - 97;
    }
}