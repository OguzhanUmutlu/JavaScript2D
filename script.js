/*** @type {{Canvas, loadImage} | null} */
let CanvasModule;
let Canvas;

try {
    CanvasModule = require("canvas");
    Canvas = CanvasModule.Canvas;
} catch (e) {}

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
     * @returns {Vector2}
     */
    clone() {
        return new Vector2(this.x, this.y);
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
    render(entity, scene) {}
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
        if(CanvasModule) {
            CanvasModule.loadImage(url).then(this.setImage);
        } else __loadImage(url, this.width, this.height).then(this.setImage);
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

    render(entity, scene) {
        scene.drawImage(this.image, this.width, this.height);
    }
}

class SquareModel extends _ShapeModel {
    render(entity, scene) {
        scene.ctx.fillStyle = this.color || "#000000";
        scene.ctx.fillRect(entity.x, entity.y, this.width, this.height);
    }
}

class TextModel extends _Model {
    /**
     * @param {string} text
     * @returns {TextModel}
     */
    setText(text) {
        this.text = text;
        return this;
    }

    /**
     * @param {number} pixels
     * @returns {TextModel}
     */
    setPixels(pixels) {
        this.pixels = pixels;
        return this;
    }

    /**
     * @param {string} font
     * @returns {TextModel}
     */
    setFont(font) {
        this.font = font;
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

    render(entity, scene) {
        scene.ctx.font = this.pixels + "px " + this.font;
        scene.ctx.fillStyle = this.color || "#000000";
        if(this.align) scene.ctx.textAlign = this.align;
        scene.ctx.fillText(this.text, entity.x, entity.y, this.maxWidth);
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
    /*** @param {EntityData} data */
    constructor(data) {
        if(!data._data.model) throw new Error("Entities should have valid model!");
        super(data._data.x, data._data.y);
        this.uuid = __uuid++;
        this.motion = data._data.motion || new Vector2(0, 0);
        this.angle = data._data.angle || 0;
        this.closed = false;
        /*** @type {_Model | _ShapeModel | SquareModel | TextModel | ImageModel} */
        this.model = data._data.model;
    }

    /**
     * @param {Vector2 | Entity} vectorOrEntity
     * @returns {boolean}
     */
    collides(vectorOrEntity) {
        if(vectorOrEntity instanceof Entity)
            return (vectorOrEntity.x + vectorOrEntity.model.width) >= this.x && vectorOrEntity.x <= (this.x + this.model.width) && vectorOrEntity.y <= (this.y + this.model.height) && (vectorOrEntity.y + vectorOrEntity.model.height) >= this.y;
        return vectorOrEntity.x >= this.x && vectorOrEntity.x <= (this.x + this.model.width) && vectorOrEntity.y <= (this.y + this.model.height) && vectorOrEntity.y >= this.y;
    }

    /**
     * @param {Scene} scene
     */
    preventBorder(scene) {
        if(this.collides(new Vector2(-1, this.y))) this.x = 0;
        if(this.collides(new Vector2(this.x, -1))) this.y = 0;
        if(this.collides(new Vector2(scene.canvas.width, this.y))) this.x = scene.canvas.width - this.model.width;
        if(this.collides(new Vector2(this.x, scene.canvas.height))) this.y = scene.canvas.height - this.model.height;
    }

    /**
     * @param {number} currentTick
     * @returns {boolean}
     */
    onUpdate(currentTick) {
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

    /*** @returns {Entity} */
    close() {
        this.closed = true;
        return this;
    }
}

class Scene {
    /*** @param {HTMLCanvasElement | Canvas} canvas */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        /*** @type {Map<Entity, number>} */
        this.entities = new Map();
        this._fps = 0;
        this.fps = 0;
        this.ticks = 0;
        setInterval(() => this._fps++);
        setInterval(() => {
            this.fps = this._fps;
            this._fps = 0;
        }, 1000);
        setInterval(() => this.onTick(this.ticks++), 50);
    }

    /**
     * @param {Image} image
     * @param {number} width
     * @param {number} height
     * @returns {Scene}
     */
    drawImage(image, width, height) {
        this.ctx.drawImage(image, width, height);
        return this;
    }

    /**
     * @param {Entity} entity
     * @param {number?} priority
     * @returns {Scene}
     */
    addEntity(entity, priority = 9) {
        this.entities.set(entity, priority);
        return this;
    }

    /**
     * @param {Entity} entity
     * @param {number} priority
     * @returns {Scene}
     */
    setEntityPriority(entity, priority) {
        if(!this.entities.has(entity)) return this;
        this.entities.set(entity, priority);
        return this;
    }

    /**
     * @param {number} currentTick
     * @returns {Scene}
     */
    onTick(currentTick) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        Array.from(this.entities).sort((a, b) => a[1] > b[1] ? -1 : (a[1] === b[1] ? 0 : 1)).map(i=> i[0]).filter(data => !data.closed).forEach(entity => {
            entity.onUpdate(currentTick);
            entity.model.render(entity, this);
        });
        return this;
    }
}

try {
    if(module) {
        module.exports = {Vector2, ImageModel, SquareModel, TextModel, EntityData, Entity, Scene};
    }
} catch (e) {}