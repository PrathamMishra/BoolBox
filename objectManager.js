class ObjectManager{
    objects;
    constructor() {
        this.objects = [];
    }

    addObject(obj) {
        let inserted = false;
        for (let i=this.objects.length-1;i>=0;i--) {
            const currObj = this.objects[i];
            if (currObj.x <= obj.x && currObj.y <= obj.y) {
                this.objects.splice(i+1, 0, obj);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            this.objects.unshift(obj);
        }
    }

    getObject(x, y) {
        let start = 0;
        let end = this.objects.length-1;
        while (start <= end) {
            let mid = Math.floor((start+end)/2);
            const currObj = this.objects[mid];
            if (currObj.x < x && currObj.y < y) {
                start = mid+1;
            } else {
                end = mid-1;
            }
        }
        return this.objects[end]?.ref;
    }
}

// objects.addObject({x:0,y:0})
// objects.addObject({x:2,y:1})
// objects.addObject({x:2,y:1.5})
// objects.addObject({x:2,y:2})
// objects.addObject({x:2,y:2.5})
// objects.addObject({x:2,y:3})
// objects.addObject({x:3,y:3})

// 2.5, 2.75