const pathTemplate = document.querySelector('#path-template');

export class PathManager {
    startPort;
    container;
    currentNode;
    sourcePorts;

    constructor(container) {
        this.startPort = null;
        this.container = container;
        this.currentNode = null;
        this.sourcePorts = [];
        this.addEventListeners();
    }

    addEventListeners() {
        document.addEventListener('mouseup', () => {
            this.clearPath();
        });
        document.addEventListener('mousemove', (event) => {
            if (this.startPort) {
                const currentPath = this.currentNode.getAttribute("d").split(" ");
                const {x: containerX, y: containerY} = this.container.getBoundingClientRect();
                currentPath[currentPath.length-1] = event.y - containerY;
                currentPath[currentPath.length-2] = event.x - containerX;
                this.currentNode.setAttribute("d", currentPath.join(' '));
            }
        });
        document.addEventListener('keyup', (event) => {
            const breakPath = event.key.toLowerCase() == 'shift';
            if (this.startPort && breakPath) {
                const currentPath = this.currentNode.getAttribute("d").split(" ");
                const currentCoord = currentPath.slice(currentPath.length-2);
                currentPath.push('L', ...currentCoord);
                this.currentNode.setAttribute("d", currentPath.join(' '));
            }
        });
        window.addEventListener('resize', () => {
            this.sourcePorts.forEach(port => {
                port.sourcedPaths && port.sourcedPaths.forEach(this.resetPathCoords.bind(this));
            });
        })
    }

    addSourcePort(node) {
        this.sourcePorts.push(node);
        node.addEventListener('mousedown', () => {
            this.startPort = node;
            this.currentNode = pathTemplate.content.cloneNode(true).querySelector('path');
            const {portCenterX, portCenterY} = this.getPortCoords(node);
            this.currentNode.setAttribute("d", `M ${portCenterX} ${portCenterY} L ${portCenterX} ${portCenterY}`);
            this.container.appendChild(this.currentNode.parentNode);
            node.sourcedPaths = node.sourcedPaths || [];
            this.currentNode.parentNode.source = node;
            node.sourcedPaths.push(this.currentNode.parentNode);
        });
    }

    addSinkPort(node) {
        node.addEventListener('mouseup', () => {
            if (!this.startPort) return;
            if (this.startPort == node) {
                this.clearPath();
                return;
            }
            const {portCenterX, portCenterY} = this.getPortCoords(node);
            const currentPath = this.currentNode.getAttribute("d").split(" ");
            currentPath[currentPath.length-1] = portCenterY;
            currentPath[currentPath.length-2] = portCenterX;
            this.currentNode.setAttribute("d", currentPath.join(' '));
            if (node.sinkingPath) {
                this.deletePath(node.sinkingPath);
            }
            node.sinkingPath = this.currentNode.parentNode;
            this.currentNode.parentNode.sink = node;
            this.startPort = null;
            this.currentNode = null;
        });
    }

    deletePath(path) {
        if (!path) return;
        this.container.removeChild(path);
        if (path.source) {
            // Remove path from source node
            path.source.sourcedPaths = path.source.sourcedPaths && path.source.sourcedPaths.filter(p=>p!=path);
            // remove source from path
            delete path.source;
        }
        if (path.sink) {
            // Remove path from sink node
            delete path.sink.sinkingPath;
            // remove sink from path
            delete path.sink;
        }
    }

    clearPath() {
        this.deletePath(this.currentNode?.parentNode);
        this.startPort = null;
        this.currentNode = null;
    }

    getPortCoords(node) {
        const {x, y, width, height} = node.getBoundingClientRect();
        const {x: containerX, y: containerY} = this.container.getBoundingClientRect();
        const portCenterX = x + width/2 - containerX;
        const portCenterY = y + height/2 - containerY;
        return {portCenterX, portCenterY};
    }

    updateConnectedPaths(node) {
        node.outputs && node.outputs.forEach(port => {
            port.sourcedPaths && port.sourcedPaths.forEach(this.resetPathCoords.bind(this));
        });
        node.inputs && node.inputs.forEach(port => {
            const path = port.sinkingPath;
            if (path) {
                this.resetPathCoords(path);
            }
        });
    }

    resetPathCoords(path) {
        const {portCenterX: sourceX, portCenterY: sourceY} = this.getPortCoords(path.source);
        const {portCenterX: sinkX, portCenterY: sinkY} = this.getPortCoords(path.sink);
        path.querySelector('path').setAttribute("d", `M ${sourceX} ${sourceY} L ${sinkX} ${sinkY}`);
    }
}