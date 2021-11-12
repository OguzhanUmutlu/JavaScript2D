/*** @type {{Canvas, loadImage} | null} */
let CanvasModule;
let Canvas;

try {
    CanvasModule = require("canvas");
    Canvas = CanvasModule.Canvas;
} catch (e) {
}

/**
 * @param {string} url
 * @param {number} width
 * @param {number} height
 * @returns {Promise<Image>}
 * @private
 */
function __loadImage(url, width, height) {
    let image = new Image(width, height);
    const promise = new Promise((res) => image.onload = () => res(image));
    image.src = url;
    return promise;
}

class Event {
    /*** @param {string} name */
    constructor(name, source) {
        this._name = name;
        this._source = source;
        this._cancelled = false;

    }

    /*** @returns {boolean} */
    isCancelled() {
        return this._cancelled;
    }

    /**
     * @param {boolean?} value
     * @returns {Event}
     */
    setCancelled(value = true) {
        this._cancelled = value;
        return this;
    }

    call() {
        if (!this._source.events[this._name]) this._source.events[this._name] = [];
        this._source.events[this._name].forEach(callable => callable(this));
    }
}

/**
 * @type {number}
 * @private
 */
let __uuid = 0;

class Vector2 {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * @param {Vector2} vector
     * @returns {number}
     */
    distance(vector) {
        return Math.sqrt(Math.pow(vector.x - this.x, 2) + Math.pow(vector.y - this.y, 2));
    }

    /**
     * @param {number | Vector2} x
     * @param {number?} y
     * @returns {Vector2}
     */
    add(x, y) {
        if (x instanceof Vector2) return this.add(x.x, x.y);
        this.x += x;
        this.y += y;
        return this;
    }

    /**
     * @param {number | Vector2} x
     * @param {number?} y
     * @returns {Vector2}
     */
    multiply(x, y) {
        if (x instanceof Vector2) return this.multiply(x.x, x.y);
        this.x *= x;
        this.y *= y;
        return this;
    }

    /**
     * @param {number | Vector2} x
     * @param {number?} y
     * @returns {Vector2}
     */
    divide(x, y) {
        return this.multiply(1 / x, 1 / y);
    }

    /**
     * @param {number | Vector2} x
     * @param {number?} y
     * @returns {Vector2}
     */
    subtract(x, y) {
        return this.add(-x, -y);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @returns {Vector2}
     */
    new(x, y) {
        return new Vector2(x, y);
    }

    /*** @returns {Vector2} */
    clone() {
        return this.new(this.x, this.y);
    }

    /**
     * @param {Vector2} vector
     * @returns {boolean}
     */
    equals(vector) {
        return vector.x === this.x && vector.y === this.y;
    }
}

class _Model {
    /**
     * @param {number} width
     * @param {number} height
     */
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * @param {Entity} entity
     * @param {Scene} scene
     */
    render(entity, scene) {
    }
}

class _ShapeModel extends _Model {
    /**
     * @param {string} color
     * @returns {_ShapeModel}
     */
    setColor(color) {
        this.color = color;
        return this;
    }
}

class ImageModel extends _Model {
    /**
     * @param {string} url
     * @returns {ImageModel}
     */
    setURL(url) {
        this.url = url;
        if (CanvasModule) {
            CanvasModule.loadImage(url).then(i => this.setImage(i));
        } else __loadImage(url, this.width, this.height).then(i => this.setImage(i));
        return this;
    }

    /**
     * @param {Image} image
     * @returns {ImageModel}
     */
    setImage(image) {
        this.image = image;
        return this;
    }

    /**
     * @param {Entity} entity
     * @param {Scene} scene
     */
    render(entity, scene) {
        scene.rotate(entity.angle || 0, entity.x, entity.y, this.width, this.height);
        const draw = () => {
            scene.ctx.drawImage(this.image, entity.x, entity.y, this.width, this.height);
            scene.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        if (!this.image && this.url) {
            console.info("Image couldn't loaded so loading it again... (Image: " + this.url + ")");
            const {url} = this;
            if (CanvasModule) {
                CanvasModule.loadImage(url).then(i => {
                    this.setImage(i);
                    draw();
                });
            } else __loadImage(url, this.width, this.height).then(i => {
                this.setImage(i);
                draw();
            });
        } else draw();
    }
}

class SquareModel extends _ShapeModel {
    /**
     * @param {Entity} entity
     * @param {Scene} scene
     */
    render(entity, scene) {
        scene.rotate(entity.angle || 0, entity.x, entity.y, this.width, this.height);
        const square = new Path2D();
        scene.ctx.fillStyle = this.color || "#000000";
        square.rect(entity.x, entity.y, this.width, this.height);
        scene.ctx.fill(square);
        scene.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}

class CircleModel extends _ShapeModel {
    /**
     * @param {Entity} entity
     * @param {Scene} scene
     */
    render(entity, scene) {
        scene.ctx.fillStyle = this.color || "#000000";
        const circle = new Path2D();
        circle.arc(entity.x, entity.y, this.width / 2, 0, 2 * Math.PI);
        scene.ctx.fill(circle);
        entity.collides = (vec) => vec.distance(entity) <= this.width;
    }
}

class TextModel extends _Model {
    constructor() {
        super(0, 0);
    }

    updateWidth() {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (this.pixels) context.font = this.pixels + "px " + this.font;
        const metrics = context.measureText(this.text || "");
        canvas.remove();
        this.width = metrics.width;
        this.height = this.pixels;
    }

    /**
     * @param {string} text
     * @returns {TextModel}
     */
    setText(text) {
        this.text = text;
        this.updateWidth();
        return this;
    }

    /**
     * @param {number} pixels
     * @returns {TextModel}
     */
    setPixels(pixels) {
        this.pixels = pixels;
        this.updateWidth();
        return this;
    }

    /**
     * @param {string} font
     * @returns {TextModel}
     */
    setFont(font) {
        this.font = font;
        this.updateWidth();
        return this;
    }

    /**
     * @param {string} color
     * @returns {TextModel}
     */
    setColor(color) {
        this.color = color;
        return this;
    }

    /**
     * @param {"right" | "left" | "center"} align
     * @returns {TextModel}
     */
    setTextAlign(align) {
        this.align = align;
        return this;
    }

    /**
     * @param {number} width
     * @returns {TextModel}
     */
    setMaxWidth(width) {
        this.maxWidth = width;
        return this;
    }

    /**
     * @param {Entity} entity
     * @param {Scene} scene
     */
    render(entity, scene) {
        scene.rotate(entity.angle || 0, entity.x, entity.y, this.width, this.height);
        scene.ctx.font = this.pixels + "px " + this.font;
        scene.ctx.fillStyle = this.color || "#000000";
        if (this.align) scene.ctx.textAlign = this.align;
        this.text.split("\n").forEach((line, index) => {
            scene.ctx.fillText(line, entity.x, entity.y + (index * this.pixels), this.maxWidth);
        });
        scene.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}

class EntityData {
    /*** @param {{x?, y?, motion?, angle?, model?}?} data */
    constructor(data) {
        this._data = data || {
            x: 0,
            y: 0,
            motion: new Vector2(0, 0),
            angle: 0,
            model: null
        };
    }

    /**
     * @param {number} x
     * @returns {EntityData}
     */
    setX(x) {
        this._data.x = x;
        return this;
    }

    /**
     * @param {number} y
     * @returns {EntityData}
     */
    setY(y) {
        this._data.y = y;
        return this;
    }

    /**
     * @param {Vector2} motion
     * @returns {EntityData}
     */
    setMotion(motion) {
        this._data.motion = motion;
        return this;
    }

    /**
     * @param {number} angle
     * @returns {EntityData}
     */
    setAngle(angle) {
        this._data.angle = angle;
        return this;
    }

    /**
     * @param {_Model} model
     * @returns {EntityData}
     */
    setModel(model) {
        this._data.model = model;
        return this;
    }
}


class Entity extends Vector2 {
    /*** @param {EntityData | {x?, y?, motion?, angle?, model?}} data */
    constructor(data) {
        if (!(data instanceof EntityData)) data = new EntityData(data);
        if (!data._data.model) throw new Error("Entities should have valid model!");
        super(data._data.x, data._data.y);
        this._data = data._data;
        this.events = {};
        this.uuid = __uuid++;
        this.motion = data._data.motion || new Vector2(0, 0);
        this.angle = data._data.angle || 0;
        this.closed = true;
        /*** @type {_Model | _ShapeModel | SquareModel | CircleModel | TextModel | ImageModel} */
        this.model = data._data.model;
    }

    /**
     * @param {"onMove"} event
     * @param {function(event: Event)} callable
     * @returns {Entity}
     */
    on(event, callable) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callable);
        return this;
    }

    /**
     * @param {Vector2} vector
     * @returns {Entity}
     */
    lookAt(vector) {
        let xDist = vector.x - this.x;
        let zDist = vector.y - this.y;
        this.angle = Math.atan2(zDist, xDist) / Math.PI * 180;
        if (this.angle < 0) this.angle += 360.0;
        return this;
    }

    /*** @returns {Vector2} */
    getDirection() {
        const deg2rad = deg => deg * Math.PI / 180;
        return new Vector2(-Math.cos(deg2rad(this.angle - 90) - (Math.PI / 2)), -Math.sin(deg2rad(this.angle - 90) - (Math.PI / 2)));
    }

    /**
     * @param {Vector2 | Entity} vectorOrEntity
     * @returns {boolean}
     */
    collides(vectorOrEntity) {
        if (vectorOrEntity instanceof Entity) {
            return (vectorOrEntity.x + vectorOrEntity.model.width - 1) >= this.x && vectorOrEntity.x <= (this.x + this.model.width - 1) && vectorOrEntity.y <= (this.y + this.model.height - 1) && (vectorOrEntity.y + vectorOrEntity.model.height - 1) >= this.y;
        } else return vectorOrEntity.x >= this.x && vectorOrEntity.x <= (this.x + this.model.width) && vectorOrEntity.y <= (this.y + this.model.height) && vectorOrEntity.y >= this.y;
    }

    /**
     * @param {Scene} scene
     * @param {(Entity[] | null)?} filter
     * @returns {Entity[]}
     */
    getCollidingEntities(scene, filter = null) {
        const collidingEntities = [];
        Array.from(scene.entities)
            .map(i => i[0])
            .filter(entity => !entity.closed)
            .filter(entity => entity.uuid !== this.uuid)
            .filter(entity => !filter || (filter.some(cl => entity instanceof cl)))
            .forEach(entity => {
                if (entity.collides(this)) collidingEntities.push(entity);
            });
        return collidingEntities;
    }

    /*** @return {string} */
    getNearBorder() {
        const ways = [
            this.collides(new Vector2(0, this.y)), // left
            this.collides(new Vector2(this.x, 0)), // up
            this.collides(new Vector2(scene.canvas.width - 1, this.y)), // right
            this.collides(new Vector2(this.x, scene.canvas.height - 1)) // down
        ];
        return Object.keys(ways).filter(i => ways[i])[0];
    }

    /*** @return {boolean} */
    isNearToBorder() {
        return this.collides(new Vector2(0, this.y))
            || this.collides(new Vector2(this.x, 0))
            || this.collides(new Vector2(scene.canvas.width - 1, this.y))
            || this.collides(new Vector2(this.x, scene.canvas.height - 1));
    }

    /**
     * @param {Scene} scene
     * @returns {boolean}
     */
    preventBorder(scene) {
        let res = false;
        if (this.x < 0) {
            this.x = 0;
            res = true;
        }
        if (this.y < 0) {
            this.y = 0;
            res = true;
        }
        if (this.x + this.model.width > scene.canvas.width) {
            this.x = scene.canvas.width - this.model.width;
            res = true;
        }
        if (this.y + this.model.height > scene.canvas.height) {
            this.y = scene.canvas.height - this.model.height;
            res = true;
        }
        return res;
    }

    /**
     * @param {number} dx
     * @param {number} dy
     */
    move(dx, dy) {
        let ev = new Event("onMove", this);
        ev.entity = this;
        ev.from = this.clone();
        ev.to = this.clone().add(dx, dy);
        if (ev.from.equals(ev.to)) return;
        ev.call();
        if (!ev.isCancelled()) {
            this.x = ev.to.x;
            this.y = ev.to.y;
        }
    }

    /**
     * @param {number} currentTick
     * @returns {boolean}
     */
    onUpdate(currentTick) {
        if (this.motion.x > 0 && this.motion.x < 0.00001) this.motion.x = 0;
        if (this.motion.y > 0 && this.motion.y < 0.00001) this.motion.y = 0;
        const dx = this.motion.x / 10;
        const dy = this.motion.y / 10;
        this.move(dx, dy);
        this.motion.x -= dx;
        this.motion.y -= dy;
        return false;
    }

    /**
     * @param {number|Vector2} x
     * @param {number} y
     */
    setMotion(x = 0, y = 0) {
        if (x instanceof Vector2) {
            this.motion = x;
        } else this.setMotion(new Vector2(x, y));
        return this;
    }

    /**
     * @param {number|Vector2} x
     * @param {number} y
     */
    addMotion(x = 0, y = 0) {
        this.motion.add(x, y);
        return this;
    }

    /*** @returns {Entity} */
    close() {
        this.closed = true;
        return this;
    }

    /**
     * @param {function(EntityData: data)} type
     * @param {Scene?} scene
     * @returns {Entity}
     */
    cloneEntity(type, scene = null) {
        const entity = new type(this._data);
        const {...obj} = this;
        Array.from(Object.entries(obj)).forEach(i => entity[i[0]] = i[1]);
        if (scene) scene.addEntity(entity);
        return entity;
    }
}

class Scene {
    /*** @param {HTMLCanvasElement | Canvas} canvas */
    constructor(canvas) {
        this.running = true;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        /*** @type {Map<Entity, number>} */
        this.entities = new Map();
        this._fps = 0;
        this.fps = 0;
        this.ticks = 0;
        this.events = {};
        setInterval(() => this._fps++);
        setInterval(() => {
            this.fps = this._fps;
            this._fps = 0;
        }, 1000);
        setInterval(() => {
            if (this.running) this.onTick(this.ticks++);
        }, 50);
    }

    /**
     * @param {"onSetRunning"} event
     * @param {function(event: Event)} callable
     * @returns {Scene}
     */
    on(event, callable) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callable);
        return this;
    }

    /**
     * @param {boolean} value
     * @returns {Scene}
     */
    setRunning(value = true) {
        const ev = new Event("onSetRunning", this);
        ev.value = value;
        ev.call();
        if (ev.isCancelled()) return this;
        this.running = value;
        return this;
    }

    /**
     * @param {number} angle
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @returns {Scene}
     */
    rotate(angle, x, y, width, height) {
        this.ctx.translate((x + (width / 2)), (y + (height / 2)));
        this.ctx.rotate(angle * Math.PI / 180);
        this.ctx.translate(-(x + (width / 2)), -(y + (height / 2)));
        return this;
    }

    /**
     * @param {Entity} entity
     * @param {number?} priority
     * @returns {Scene}
     */
    addEntity(entity, priority = 9) {
        entity.closed = false;
        this.entities.set(entity, priority);
        return this;
    }

    /**
     * @param {Entity} entity
     * @returns {Scene}
     */
    removeEntity(entity) {
        entity.closed = false;
        this.entities.delete(entity);
        return this;
    }

    /**
     * @param {Entity} entity
     * @param {number} priority
     * @returns {Scene}
     */
    setEntityPriority(entity, priority) {
        if (!this.entities.has(entity)) return this;
        this.entities.set(entity, priority);
        return this;
    }

    /**
     * @param {number} currentTick
     * @returns {Scene}
     */
    onTick(currentTick) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        Array.from(this.entities).sort((a, b) => a[1] > b[1] ? -1 : (a[1] === b[1] ? 0 : 1)).map(i => i[0]).filter(data => !data.closed).forEach(entity => {
            entity.onUpdate(currentTick);
            entity.model.render(entity, this);
        });
        return this;
    }
}

try {
    if (module) {
        module.exports = {Vector2, ImageModel, SquareModel, TextModel, EntityData, Entity, Scene};
    }
} catch (e) {
}