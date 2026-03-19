const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const viewport = {
    dpr: window.devicePixelRatio || 1,
    width: window.innerWidth,
    height: window.innerHeight
};

const keys = {};
let target = null;
let frame = 0;
let frameTimer = 0;
let direction = "down";
let gameStarted = false;
let interactionRequested = false;
const spriteCollisionBounds = {};

const IDLE_FRAME = 0;
const WORLD_STEP = 2;
const WORLD_RUN_STEP = 4;
const PLAYER_COLLISION_MARGIN = 8;
const PLAYER_COLLISION_BASE = {
    width: 16,
    height: 19
};

ctx.imageSmoothingEnabled = false;

function loadSprite(src) {
    const image = new Image();
    image.src = src;
    return image;
}

const spriteAssets = {
    background: loadSprite("bg.png"),
    nurseJoy: loadSprite("Spritesnpcs/joynurses.png"),
    playerDownIdle: loadSprite("Spritesheet/abajoquieto.png"),
    playerDownWalk1: loadSprite("Spritesheet/abajoandando1.png"),
    playerUpIdle: loadSprite("Spritesheet/arribaquieto.png"),
    playerUpWalk1: loadSprite("Spritesheet/arribaandando1.png"),
    playerLeftIdle: loadSprite("Spritesheet/izquierdaquieto.png"),
    playerLeftWalk1: loadSprite("Spritesheet/izquierdaandando1.png"),
    playerLeftWalk2: loadSprite("Spritesheet/izquierdandando2.png")
};

const spriteControls = {
    background: {
        x: 0,
        y: 0,
        width: null,
        height: null
    },
    nurseJoy: {
        x: 720,
        y: 192,
        width: 112,
        height: 114
    },
    playerDownIdle: {
        x: 0,
        y: 0,
        width: 96,
        height: 120
    },
    playerDownWalk1: {
        x: 0,
        y: 0,
        width: 96,
        height: 126
    },
    playerUpIdle: {
        x: 0,
        y: 0,
        width: 96,
        height: 126
    },
    playerUpWalk1: {
        x: 0,
        y: 0,
        width: 96,
        height: 126
    },
    playerLeftIdle: {
        x: 0,
        y: 0,
        width: 102,
        height: 126
    },
    playerLeftWalk1: {
        x: 0,
        y: 0,
        width: 108,
        height: 126
    },
    playerLeftWalk2: {
        x: 0,
        y: 0,
        width: 108,
        height: 126
    }
};

window.spriteControls = spriteControls;

function insetRect(rect, insetLeft = 0, insetTop = 0, insetRight = insetLeft, insetBottom = insetTop) {
    return {
        x: rect.x + insetLeft,
        y: rect.y + insetTop,
        width: rect.width - insetLeft - insetRight,
        height: rect.height - insetTop - insetBottom
    };
}

const collisionSpriteInstances = [
    { type: "armario", x: 88, y: 89, width: 325, height: 188 },
    { type: "pc", x: 1166, y: 70, width: 146, height: 210 },
    { type: "mesa", x: 401, y: 270, width: 92, height: 91 },
    { type: "mesa", x: 1049, y: 271, width: 92, height: 91 },
    { type: "mesa", x: 252, y: 660, width: 116, height: 62 },
    { type: "pc", x: 252, y: 722, width: 44, height: 131 },
    { type: "pc", x: 324, y: 722, width: 44, height: 131 },
    { type: "mesa", x: 1165, y: 661, width: 115, height: 62 },
    { type: "pc", x: 1165, y: 723, width: 44, height: 130 },
    { type: "pc", x: 1236, y: 723, width: 44, height: 130 }
];

const mostradorCollisionAreas = [
    { x: 731, y: 275, width: 97, height: 156 }
];

function getInstanceCollisionRect(instance) {
    if (instance.type === "mesa") {
        return insetRect(instance, 22, 18, 22, 24);
    }

    if (instance.type === "pc") {
        return insetRect(instance, 10, 10, 10, 16);
    }

    if (instance.type === "armario") {
        return insetRect(instance, 22, 18, 22, 24);
    }

    return {
        x: instance.x,
        y: instance.y,
        width: instance.width,
        height: instance.height
    };
}

const collisionAreas = [
    ...mostradorCollisionAreas,
    ...collisionSpriteInstances.map((instance) => getInstanceCollisionRect(instance))
];

const player = {
    x: 0,
    y: 0,
    speed: WORLD_STEP,
    runSpeed: WORLD_RUN_STEP
};

const animations = {
    down: [
        { assetKey: "playerDownIdle", flipX: false },
        { assetKey: "playerDownWalk1", flipX: false },
        { assetKey: "playerDownWalk1", flipX: true }
    ],
    up: [
        { assetKey: "playerUpIdle", flipX: false },
        { assetKey: "playerUpWalk1", flipX: false },
        { assetKey: "playerUpWalk1", flipX: true }
    ],
    left: [
        { assetKey: "playerLeftIdle", flipX: false },
        { assetKey: "playerLeftWalk1", flipX: false },
        { assetKey: "playerLeftWalk2", flipX: false }
    ],
    right: [
        { assetKey: "playerLeftIdle", flipX: true },
        { assetKey: "playerLeftWalk1", flipX: true },
        { assetKey: "playerLeftWalk2", flipX: true }
    ]
};

function resizeCanvas() {
    viewport.dpr = window.devicePixelRatio || 1;
    viewport.width = window.innerWidth;
    viewport.height = window.innerHeight;

    canvas.width = Math.floor(viewport.width * viewport.dpr);
    canvas.height = Math.floor(viewport.height * viewport.dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
}

function getCurrentFrameConfig() {
    const currentAnimation = animations[direction];
    return currentAnimation[frame] || currentAnimation[IDLE_FRAME];
}

function getSpriteDimensions(assetKey) {
    const image = spriteAssets[assetKey];
    const controls = spriteControls[assetKey];

    return {
        width: controls.width ?? image.naturalWidth,
        height: controls.height ?? image.naturalHeight
    };
}

function computeOpaqueBounds(image) {
    try {
        const buffer = document.createElement("canvas");
        const bufferCtx = buffer.getContext("2d", { willReadFrequently: true });

        buffer.width = image.naturalWidth;
        buffer.height = image.naturalHeight;
        bufferCtx.clearRect(0, 0, buffer.width, buffer.height);
        bufferCtx.drawImage(image, 0, 0);

        const { data, width, height } = bufferCtx.getImageData(0, 0, buffer.width, buffer.height);
        let minX = width;
        let minY = height;
        let maxX = -1;
        let maxY = -1;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const alpha = data[(y * width + x) * 4 + 3];

                if (alpha === 0) {
                    continue;
                }

                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }

        if (maxX === -1) {
            return {
                x: 0,
                y: 0,
                width,
                height
            };
        }

        return {
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
    } catch (error) {
        return {
            x: 0,
            y: 0,
            width: image.naturalWidth,
            height: image.naturalHeight
        };
    }
}

function cacheSpriteCollisionBounds() {
    Object.entries(spriteAssets).forEach(([assetKey, image]) => {
        if (!image.complete || !image.naturalWidth || assetKey === "background" || assetKey === "nurseJoy") {
            return;
        }

        spriteCollisionBounds[assetKey] = computeOpaqueBounds(image);
    });
}

function getWorldRect() {
    const background = spriteAssets.background;
    const controls = spriteControls.background;
    const sourceWidth = controls.width ?? background.naturalWidth;
    const sourceHeight = controls.height ?? background.naturalHeight;
    const worldRatio = sourceWidth / sourceHeight;
    const viewportRatio = viewport.width / viewport.height;

    let width;
    let height;

    if (viewportRatio > worldRatio) {
        height = viewport.height;
        width = height * worldRatio;
    } else {
        width = viewport.width;
        height = width / worldRatio;
    }

    return {
        x: Math.round((viewport.width - width) / 2),
        y: Math.round((viewport.height - height) / 2),
        width: Math.round(width),
        height: Math.round(height),
        sourceWidth,
        sourceHeight
    };
}

function worldToScreenX(worldX, worldRect) {
    return worldRect.x + (worldX / worldRect.sourceWidth) * worldRect.width;
}

function worldToScreenY(worldY, worldRect) {
    return worldRect.y + (worldY / worldRect.sourceHeight) * worldRect.height;
}

function worldToScreenWidth(worldWidth, worldRect) {
    return (worldWidth / worldRect.sourceWidth) * worldRect.width;
}

function worldToScreenHeight(worldHeight, worldRect) {
    return (worldHeight / worldRect.sourceHeight) * worldRect.height;
}

function screenToWorldPoint(screenX, screenY, worldRect) {
    const clampedX = Math.min(Math.max(screenX, worldRect.x), worldRect.x + worldRect.width);
    const clampedY = Math.min(Math.max(screenY, worldRect.y), worldRect.y + worldRect.height);

    return {
        x: ((clampedX - worldRect.x) / worldRect.width) * worldRect.sourceWidth,
        y: ((clampedY - worldRect.y) / worldRect.height) * worldRect.sourceHeight
    };
}

function scaleRectToScreen(rect, worldRect) {
    return {
        x: Math.round(worldToScreenX(rect.x, worldRect)),
        y: Math.round(worldToScreenY(rect.y, worldRect)),
        width: Math.round(worldToScreenWidth(rect.width, worldRect)),
        height: Math.round(worldToScreenHeight(rect.height, worldRect))
    };
}

function getPlayerWorldSize(frameConfig = getCurrentFrameConfig()) {
    const spriteSize = getSpriteDimensions(frameConfig.assetKey);
    return {
        width: spriteSize.width,
        height: spriteSize.height
    };
}

function getPlayerHitbox(nextX = player.x, nextY = player.y) {
    const currentFrame = getCurrentFrameConfig();
    const assetKey = currentFrame.assetKey;
    const playerSize = getPlayerWorldSize(currentFrame);
    const controls = spriteControls[assetKey];
    const hitboxWidth = PLAYER_COLLISION_BASE.width;
    const hitboxHeight = PLAYER_COLLISION_BASE.height;

    return {
        x: nextX + controls.x + (playerSize.width - hitboxWidth) / 2,
        y: nextY + controls.y + playerSize.height - hitboxHeight,
        width: hitboxWidth,
        height: hitboxHeight
    };
}

function intersects(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function expandRect(rect, amount) {
    return {
        x: rect.x - amount,
        y: rect.y - amount,
        width: rect.width + amount * 2,
        height: rect.height + amount * 2
    };
}

function canMoveTo(nextX, nextY) {
    const worldRect = getWorldRect();
    const hitbox = getPlayerHitbox(nextX, nextY);

    if (
        hitbox.x < 0 ||
        hitbox.y < 0 ||
        hitbox.x + hitbox.width > worldRect.sourceWidth ||
        hitbox.y + hitbox.height > worldRect.sourceHeight
    ) {
        return false;
    }

    return !collisionAreas.some((area) => intersects(hitbox, expandRect(area, PLAYER_COLLISION_MARGIN)));
}

function movePlayer(dx, dy) {
    let moved = false;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
    const stepX = dx / steps;
    const stepY = dy / steps;

    for (let index = 0; index < steps; index++) {
        if (stepX !== 0 && canMoveTo(player.x + stepX, player.y)) {
            player.x += stepX;
            moved = true;
        }

        if (stepY !== 0 && canMoveTo(player.x, player.y + stepY)) {
            player.y += stepY;
            moved = true;
        }
    }

    return moved;
}

function getCenteredSpawnPosition() {
    const worldRect = getWorldRect();
    const playerSize = getPlayerWorldSize({ assetKey: "playerDownIdle" });
    const preferredX = Math.round(worldRect.sourceWidth / 2 - playerSize.width / 2);
    const preferredY = Math.round(worldRect.sourceHeight / 2 - playerSize.height / 2);

    if (canMoveTo(preferredX, preferredY)) {
        return { x: preferredX, y: preferredY };
    }

    const step = 8;
    const maxRadius = Math.ceil(Math.max(worldRect.sourceWidth, worldRect.sourceHeight) / step);

    for (let radius = 1; radius <= maxRadius; radius++) {
        for (let offsetY = -radius; offsetY <= radius; offsetY++) {
            for (let offsetX = -radius; offsetX <= radius; offsetX++) {
                if (Math.abs(offsetX) !== radius && Math.abs(offsetY) !== radius) {
                    continue;
                }

                const candidateX = preferredX + offsetX * step;
                const candidateY = preferredY + offsetY * step;

                if (canMoveTo(candidateX, candidateY)) {
                    return { x: candidateX, y: candidateY };
                }
            }
        }
    }

    return { x: preferredX, y: preferredY };
}

function placePlayerAtRoomCenter() {
    const spawn = getCenteredSpawnPosition();
    player.x = spawn.x;
    player.y = spawn.y;
}

function keepPlayerInsideWorld() {
    const playerSize = getPlayerWorldSize();
    const worldRect = getWorldRect();
    player.x = Math.min(Math.max(player.x, 0), worldRect.sourceWidth - playerSize.width);
    player.y = Math.min(Math.max(player.y, 0), worldRect.sourceHeight - playerSize.height);
}

function drawBackground(worldRect) {
    const background = spriteAssets.background;
    const controls = spriteControls.background;
    const sourceWidth = controls.width ?? background.naturalWidth;
    const sourceHeight = controls.height ?? background.naturalHeight;

    ctx.drawImage(
        background,
        controls.x,
        controls.y,
        sourceWidth,
        sourceHeight,
        worldRect.x,
        worldRect.y,
        worldRect.width,
        worldRect.height
    );
}

function drawConfiguredSprite(assetKey, worldRect, flipX = false) {
    const image = spriteAssets[assetKey];
    const controls = spriteControls[assetKey];
    const spriteWidth = controls.width ?? image.naturalWidth;
    const spriteHeight = controls.height ?? image.naturalHeight;
    const screenX = Math.round(worldToScreenX(controls.x, worldRect));
    const screenY = Math.round(worldToScreenY(controls.y, worldRect));
    const screenWidth = Math.round(worldToScreenWidth(spriteWidth, worldRect));
    const screenHeight = Math.round(worldToScreenHeight(spriteHeight, worldRect));

    if (flipX) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(image, -(screenX + screenWidth), screenY, screenWidth, screenHeight);
        ctx.restore();
        return;
    }

    ctx.drawImage(image, screenX, screenY, screenWidth, screenHeight);
}

function drawPlayer(worldRect) {
    const currentFrame = getCurrentFrameConfig();
    const image = spriteAssets[currentFrame.assetKey];

    if (!image.complete || !image.naturalWidth) {
        return;
    }

    const controls = spriteControls[currentFrame.assetKey];
    const spriteWidth = controls.width ?? image.naturalWidth;
    const spriteHeight = controls.height ?? image.naturalHeight;
    const screenX = Math.round(worldToScreenX(player.x + controls.x, worldRect));
    const screenY = Math.round(worldToScreenY(player.y + controls.y, worldRect));
    const screenWidth = Math.round(worldToScreenWidth(spriteWidth, worldRect));
    const screenHeight = Math.round(worldToScreenHeight(spriteHeight, worldRect));

    if (currentFrame.flipX) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(image, -(screenX + screenWidth), screenY, screenWidth, screenHeight);
        ctx.restore();
        return;
    }

    ctx.drawImage(image, screenX, screenY, screenWidth, screenHeight);
}

function draw() {
    ctx.clearRect(0, 0, viewport.width, viewport.height);

    const worldRect = getWorldRect();
    drawBackground(worldRect);
    drawConfiguredSprite("nurseJoy", worldRect);
    drawPlayer(worldRect);
}

function moveKeyboard() {
    const currentSpeed = keys.z ? player.runSpeed : player.speed;

    if (keys.w || keys.arrowup) {
        direction = "up";
        return movePlayer(0, -currentSpeed);
    }

    if (keys.s || keys.arrowdown) {
        direction = "down";
        return movePlayer(0, currentSpeed);
    }

    if (keys.a || keys.arrowleft) {
        direction = "left";
        return movePlayer(-currentSpeed, 0);
    }

    if (keys.d || keys.arrowright) {
        direction = "right";
        return movePlayer(currentSpeed, 0);
    }

    return false;
}

function moveToTarget() {
    if (!target) {
        return false;
    }

    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= 2) {
        target = null;
        return false;
    }

    const moveX = (dx / distance) * player.speed;
    const moveY = (dy / distance) * player.speed;

    if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? "right" : "left";
    } else {
        direction = dy > 0 ? "down" : "up";
    }

    return movePlayer(moveX, moveY);
}

function updateAnimation(isMoving) {
    if (!isMoving) {
        frame = IDLE_FRAME;
        frameTimer = 0;
        return;
    }

    frameTimer += 1;

    if (frameTimer > 10) {
        const currentAnimation = animations[direction];
        frame = (frame + 1) % currentAnimation.length;
        frameTimer = 0;
    }
}

function tryInteract() {
    if (!interactionRequested) {
        return;
    }

    interactionRequested = false;

    // Punto de entrada para futuras interacciones con NPCs y objetos.
}

function gameLoop() {
    const movingKeyboard = moveKeyboard();
    const movingMouse = moveToTarget();

    tryInteract();
    updateAnimation(movingKeyboard || movingMouse);
    keepPlayerInsideWorld();
    draw();

    window.requestAnimationFrame(gameLoop);
}

function handleSpriteLoading() {
    const allSprites = Object.values(spriteAssets);
    let loadedSprites = 0;

    function onSpriteReady() {
        loadedSprites += 1;

        if (loadedSprites === allSprites.length && !gameStarted) {
            cacheSpriteCollisionBounds();
            gameStarted = true;
            placePlayerAtRoomCenter();
            draw();
            gameLoop();
        }
    }

    allSprites.forEach((image) => {
        if (image.complete && image.naturalWidth) {
            onSpriteReady();
            return;
        }

        image.addEventListener("load", onSpriteReady, { once: true });
    });
}

document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (["w", "a", "s", "d", "z", "c", "enter", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(key)) {
        keys[key] = true;

        if (["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(key)) {
            target = null;
        }

        if (key === "c" || key === "enter") {
            interactionRequested = true;
        }

        event.preventDefault();
    }
});

document.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();

    if (["w", "a", "s", "d", "z", "c", "enter", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(key)) {
        keys[key] = false;
        event.preventDefault();
    }
});

canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const worldRect = getWorldRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    target = screenToWorldPoint(clickX, clickY, worldRect);
});

window.addEventListener("resize", () => {
    resizeCanvas();
    keepPlayerInsideWorld();

    if (gameStarted) {
        draw();
    }
});

resizeCanvas();
handleSpriteLoading();
