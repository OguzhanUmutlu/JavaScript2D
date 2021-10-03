# JavaScript2D
Easy and perfect game engine made with JavaScript!

<hr>

# NPM

![NPM](https://nodei.co/npm/canvas-game-2d.png?downloads=true&downloadRank=true)

<hr>

# You can visit Wiki for any information!
[Click to visit Wiki](https://github.com/OguzhanUmutlu/JavaScript2D/wiki)

<hr>

# Setup & Installation

## Injecting into HTML
```html
<script src="https://raw.githubusercontent.com/OguzhanUmutlu/JavaScript2D/main/script.js"></script>
```

*****

## Injecting into Node.JS

- Install [`2d-canvas-game`](https://www.npmjs.com/package/2d-canvas-game) as dependency first!

```js
const {Vector2, ImageModel, SquareModel, TextModel, EntityData, Entity, Scene} = require("canvas-game-2d");
```

*****

- You can install it to your IDE by holding your mouse on it and clicking `Download library`

<hr>

# Creating scene

## Creating canvas tag

```html
<canvas style="outline: black 3px solid;" id="canvas" width="500" height="500"></canvas>
```

*****

## Creating scene in pure.js

```html
<script>
    const canvas = document.getElementById("canvas");
    const scene = new Scene(canvas);
</script>
```

*****

## Creating scene in node.js

```js
const { createCanvas } = require("canvas");
const canvas = createCanvas(500, 500);
const scene = new Scene(canvas);
```

<hr>

# Simple Player Example

## Creating player

```js
    const player = new Entity(
        new EntityData()
            .setX(0) // spawn position of player
            .setY(0)
            .setModel(new SquareModel(20, 20)) // width, height
    );
```

## Registering player to scene

```js
    scene.addEntity(player);
```

## Storing keys they are held

```js
    const heldKeys = {};
    addEventListener("keydown", key => {
        heldKeys[key.key] = true;
    });
    addEventListener("keyup", key => {
        delete heldKeys[key.key];
    });
```

## Moving player

```js
    setInterval(() => {
        let dx = 0;
        let dy = 0;
        if (heldKeys["w"]) dy--;
        if (heldKeys["a"]) dx--;
        if (heldKeys["s"]) dy++;
        if (heldKeys["d"]) dx++;
        player.x += dx;
        player.y += dy; // simply change player's position
    });
```

## To prevent going outside from canvas

```js
    setInterval(() => {
        let dx = 0;
        let dy = 0;
        if (heldKeys["w"]) dy--;
        if (heldKeys["a"]) dx--;
        if (heldKeys["s"]) dy++;
        if (heldKeys["d"]) dx++;
        player.x += dx;
        player.y += dy;
        player.preventBorder(scene);
    });
```

<hr>

# Adding obstacles

## Creating class for obstacles

```js
    class Obstacle extends Entity {
    }
```

## Adding obstacle

```js
    scene.addEntity(new Obstacle(
        new EntityData()
            .setX(50)
            .setY(50)
            .setModel(new SquareModel(20, 20))
    ));
```

## Preventing player to move in it

```js
    setInterval(() => {
        let dx = 0;
        let dy = 0;
        if (heldKeys["w"]) dy--;
        if (heldKeys["a"]) dx--;
        if (heldKeys["s"]) dy++;
        if (heldKeys["d"]) dx++;
        player.x += dx;
        if (player.getCollidingEntities(scene, [Obstacle]).length > 0) player.x -= dx;
        player.y += dy;
        if (player.getCollidingEntities(scene, [Obstacle]).length > 0) player.y -= dy;
        player.preventBorder(scene);
    });
```

<hr>

# Adding texts

## Creating text

```js
    const text = new Entity(
        new EntityData()
            .setX(30)
            .setY(30)
            .setModel(
                new TextModel(10, 10) // width, height
                    .setText("Hello World!") // text of model
                    .setFont("Impact") // font of text
                    .setColor("rgba(0, 255, 0, 0.5)") // color of text
                    .setPixels(16) // size of the text
                    .setMaxWidth(100) // maximum size of the text
            )
    );
```

## Adding text as entity

```js
    scene.addEntity(text);
```

## Changing content of the text entity

```js
    text.model.setText("Bye World!");
```