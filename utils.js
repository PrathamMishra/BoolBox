export function makeDraggable(node, container, excludePath, onDragMove) {
    let picked = false;
    node.addEventListener('mousedown', function(event) {
        if (event.target.closest(excludePath)) return;
        picked = true;
        node.classList.add('dragging');
    });
    container.addEventListener('mousemove', function(event) {
        if (picked) {
            const parentBound = container.getBoundingClientRect();
            const left = event.x - parentBound.x - Math.floor(node.clientWidth/2), top = event.y - parentBound.y - Math.floor(node.clientHeight/2);
            const right = left + node.clientWidth, bottom = top + node.clientHeight;
            if (top > 0 && bottom < parentBound.height && left > 0 && right < parentBound.width) {
                node.style.top = top + "px";
                node.style.left = left + "px";
                // On Movement of nodes, they should reevaluate their paths 
                if (onDragMove) {
                    onDragMove(top, left);
                }
            }
        }
    });
    document.addEventListener('mouseup', function() {
        if (picked) {
            picked = false;
            node.classList.remove('dragging');
        }
    });
}