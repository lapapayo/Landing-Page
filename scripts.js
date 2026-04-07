const backgroundCanvas = document.getElementById("backgroundCanvas");
const backgroundCtx = backgroundCanvas.getContext("2d");
const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d");

gameCanvas.tabIndex = 0;

const WORLD_WIDTH = 1920;
const WORLD_HEIGHT = 1080;
const PLAYER_WIDTH = 96;
const PLAYER_HEIGHT = 114;
const PLAYER_HITBOX_OFFSET_Y = PLAYER_HEIGHT / 2;
const PLAYER_HITBOX_HEIGHT = PLAYER_HEIGHT / 2;
const PLAYER_SPEED = 240;
const RUN_SPEED_MULTIPLIER = 1.75;
const WALK_FRAME_DURATION = 140;
const RUN_FRAME_DURATION = 90;
const CLICK_STOP_DISTANCE = 6;
const SHOW_COLLISION_DEBUG = true;
const RUN_KEY = "z";
const WALKABLE_WHITE_THRESHOLD = 250;

const viewport = {
    dpr: window.devicePixelRatio || 1,
    width: window.innerWidth,
    height: window.innerHeight
};

const MOVEMENT_KEYS = ["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"];

const player = {
    x: 0,
    y: 0
};

const npc = {
    joy: {
        x: 840,
        y: 138,
        width: 72,
        height: 96
    }
};

// Collision bounds synced to the current HsBG/HsLD.png layout.
const collisionRects = [
    { x: 1418, y: 78, width: 119, height: 225 },
    { x: 1574, y: 100, width: 186, height: 143 },
    { x: 268, y: 104, width: 241, height: 203 },
    { x: 902, y: 336, width: 116, height: 123 },
    { x: 268, y: 707, width: 241, height: 205 },
    { x: 1418, y: 707, width: 247, height: 204 }
];

let backgroundDirty = true;
let previousRenderState = "";
let lastFrameTime = 0;
let direction = "down";
let frame = 0;
let frameTimer = 0;
let target = null;
let isRunning = false;
let walkableMaskData = null;
const movementKeyOrder = [];

backgroundCtx.imageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

function loadSprite(src) {
    const image = new Image();
    image.src = src;
    return image;
}

const assets = {
    background: loadSprite("bg.png"),
    walkableMask: loadSprite("bgtransitable.png"),
    nurseJoy: loadSprite("Spritesnpcs/joynurses.png"),
    playerDownIdle: loadSprite("Spritesheet/abajoquieto.png"),
    playerDownWalk1: loadSprite("Spritesheet/abajoandando1.png"),
    playerUpIdle: loadSprite("Spritesheet/arribaquieto.png"),
    playerUpWalk1: loadSprite("Spritesheet/arribaandando1.png"),
    playerLeftIdle: loadSprite("Spritesheet/izquierdaquieto.png"),
    playerLeftWalk1: loadSprite("Spritesheet/izquierdaandando1.png"),
    playerLeftWalk2: loadSprite("Spritesheet/izquierdandando2.png")
};

const animations = {
    down: {
        idle: { assetKey: "playerDownIdle", flipX: false },
        walk: [
            { assetKey: "playerDownWalk1", flipX: false },
            { assetKey: "playerDownWalk1", flipX: true }
        ]
    },
    up: {
        idle: { assetKey: "playerUpIdle", flipX: false },
        walk: [
            { assetKey: "playerUpWalk1", flipX: false },
            { assetKey: "playerUpWalk1", flipX: true }
        ]
    },
    left: {
        idle: { assetKey: "playerLeftIdle", flipX: false },
        walk: [
            { assetKey: "playerLeftWalk1", flipX: false },
            { assetKey: "playerLeftWalk2", flipX: false }
        ]
    },
    right: {
        idle: { assetKey: "playerLeftIdle", flipX: true },
        walk: [
            { assetKey: "playerLeftWalk1", flipX: true },
            { assetKey: "playerLeftWalk2", flipX: true }
        ]
    }
};

function handleAssetReady(image) {
    if (image === assets.background) {
        backgroundDirty = true;
    }

    if (image === assets.walkableMask) {
        cacheWalkableMask();
    }

    draw(true);
}

function cacheWalkableMask() {
    if (!assets.walkableMask.complete || !assets.walkableMask.naturalWidth) {
        walkableMaskData = null;
        return;
    }

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = assets.walkableMask.naturalWidth;
    maskCanvas.height = assets.walkableMask.naturalHeight;

    const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
    maskCtx.imageSmoothingEnabled = false;
    maskCtx.drawImage(assets.walkableMask, 0, 0);
    walkableMaskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
}

Object.values(assets).forEach((image) => {
    image.addEventListener("load", () => {
        handleAssetReady(image);
    });

    if (image.complete && image.naturalWidth) {
        handleAssetReady(image);
    }
});

function resizeCanvas() {
    viewport.dpr = window.devicePixelRatio || 1;
    viewport.width = window.innerWidth;
    viewport.height = window.innerHeight;

    backgroundCanvas.width = Math.floor(viewport.width * viewport.dpr);
    backgroundCanvas.height = Math.floor(viewport.height * viewport.dpr);
    backgroundCanvas.style.width = `${viewport.width}px`;
    backgroundCanvas.style.height = `${viewport.height}px`;

    gameCanvas.width = Math.floor(viewport.width * viewport.dpr);
    gameCanvas.height = Math.floor(viewport.height * viewport.dpr);
    gameCanvas.style.width = `${viewport.width}px`;
    gameCanvas.style.height = `${viewport.height}px`;

    backgroundCtx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    backgroundCtx.imageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    backgroundDirty = true;
}

function getWorldRect() {
    const worldRatio = WORLD_WIDTH / WORLD_HEIGHT;
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
        height: Math.round(height)
    };
}

function worldToScreenX(worldX, worldRect) {
    return worldRect.x + (worldX / WORLD_WIDTH) * worldRect.width;
}

function worldToScreenY(worldY, worldRect) {
    return worldRect.y + (worldY / WORLD_HEIGHT) * worldRect.height;
}

function worldToScreenWidth(worldWidth, worldRect) {
    return (worldWidth / WORLD_WIDTH) * worldRect.width;
}

function worldToScreenHeight(worldHeight, worldRect) {
    return (worldHeight / WORLD_HEIGHT) * worldRect.height;
}

function screenToWorldPoint(screenX, screenY, worldRect) {
    const clampedX = Math.min(Math.max(screenX, worldRect.x), worldRect.x + worldRect.width);
    const clampedY = Math.min(Math.max(screenY, worldRect.y), worldRect.y + worldRect.height);

    return {
        x: ((clampedX - worldRect.x) / worldRect.width) * WORLD_WIDTH,
        y: ((clampedY - worldRect.y) / worldRect.height) * WORLD_HEIGHT
    };
}

function getPlayerHitbox(nextX = player.x, nextY = player.y) {
    return {
        x: nextX,
        y: nextY + PLAYER_HITBOX_OFFSET_Y,
        width: PLAYER_WIDTH,
        height: PLAYER_HITBOX_HEIGHT
    };
}

function rectanglesOverlap(rectA, rectB) {
    return (
        rectA.x < rectB.x + rectB.width &&
        rectA.x + rectA.width > rectB.x &&
        rectA.y < rectB.y + rectB.height &&
        rectA.y + rectA.height > rectB.y
    );
}

function collidesWithObstacle(hitbox) {
    return collisionRects.some((obstacle) => rectanglesOverlap(hitbox, obstacle));
}

function isWalkablePixel(worldX, worldY) {
    if (!walkableMaskData) {
        return !collidesWithObstacle({
            x: worldX,
            y: worldY,
            width: 1,
            height: 1
        });
    }

    const pixelX = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.round(worldX)));
    const pixelY = Math.max(0, Math.min(WORLD_HEIGHT - 1, Math.round(worldY)));
    const pixelIndex = (pixelY * walkableMaskData.width + pixelX) * 4;
    const data = walkableMaskData.data;
    const alpha = data[pixelIndex + 3];

    if (alpha === 0) {
        return false;
    }

    return (
        data[pixelIndex] >= WALKABLE_WHITE_THRESHOLD &&
        data[pixelIndex + 1] >= WALKABLE_WHITE_THRESHOLD &&
        data[pixelIndex + 2] >= WALKABLE_WHITE_THRESHOLD
    );
}

function isWalkableHitbox(hitbox) {
    const startX = Math.max(0, Math.floor(hitbox.x));
    const startY = Math.max(0, Math.floor(hitbox.y));
    const endX = Math.min(WORLD_WIDTH - 1, Math.ceil(hitbox.x + hitbox.width) - 1);
    const endY = Math.min(WORLD_HEIGHT - 1, Math.ceil(hitbox.y + hitbox.height) - 1);

    for (let sampleY = startY; sampleY <= endY; sampleY++) {
        for (let sampleX = startX; sampleX <= endX; sampleX++) {
            if (!isWalkablePixel(sampleX, sampleY)) {
                return false;
            }
        }
    }

    return true;
}

function canMoveTo(nextX, nextY) {
    if (
        nextX < 0 ||
        nextY < 0 ||
        nextX + PLAYER_WIDTH > WORLD_WIDTH ||
        nextY + PLAYER_HEIGHT > WORLD_HEIGHT
    ) {
        return false;
    }

    const playerHitbox = getPlayerHitbox(nextX, nextY);
    return isWalkableHitbox(playerHitbox) && !collidesWithObstacle(playerHitbox);
}

function placePlayerAtRoomCenter() {
    const preferredX = Math.round(WORLD_WIDTH / 2 - PLAYER_WIDTH / 2);
    const preferredY = Math.round(WORLD_HEIGHT / 2 - PLAYER_HEIGHT / 2);

    if (canMoveTo(preferredX, preferredY)) {
        player.x = preferredX;
        player.y = preferredY;
        return;
    }

    const step = 8;
    const maxRadius = Math.ceil(Math.max(WORLD_WIDTH, WORLD_HEIGHT) / step);

    for (let radius = 1; radius <= maxRadius; radius++) {
        for (let offsetY = -radius; offsetY <= radius; offsetY++) {
            for (let offsetX = -radius; offsetX <= radius; offsetX++) {
                if (Math.abs(offsetX) !== radius && Math.abs(offsetY) !== radius) {
                    continue;
                }

                const candidateX = preferredX + offsetX * step;
                const candidateY = preferredY + offsetY * step;

                if (canMoveTo(candidateX, candidateY)) {
                    player.x = candidateX;
                    player.y = candidateY;
                    return;
                }
            }
        }
    }

    player.x = preferredX;
    player.y = preferredY;
}

function drawBackground(worldRect) {
    backgroundCtx.clearRect(0, 0, viewport.width, viewport.height);
    backgroundCtx.fillStyle = "#000000";
    backgroundCtx.fillRect(0, 0, viewport.width, viewport.height);

    if (!assets.background.complete || !assets.background.naturalWidth) {
        return;
    }

    backgroundCtx.drawImage(
        assets.background,
        worldRect.x,
        worldRect.y,
        worldRect.width,
        worldRect.height
    );
}

function drawNpc(worldRect) {
    if (!assets.nurseJoy.complete || !assets.nurseJoy.naturalWidth) {
        return;
    }

    const screenX = Math.round(worldToScreenX(npc.joy.x, worldRect));
    const screenY = Math.round(worldToScreenY(npc.joy.y, worldRect));
    const screenWidth = Math.round(worldToScreenWidth(npc.joy.width, worldRect));
    const screenHeight = Math.round(worldToScreenHeight(npc.joy.height, worldRect));

    ctx.drawImage(assets.nurseJoy, screenX, screenY, screenWidth, screenHeight);
}

function drawPlayerFallback(worldRect) {
    const screenX = Math.round(worldToScreenX(player.x, worldRect));
    const screenY = Math.round(worldToScreenY(player.y, worldRect));
    const screenWidth = Math.round(worldToScreenWidth(PLAYER_WIDTH, worldRect));
    const screenHeight = Math.round(worldToScreenHeight(PLAYER_HEIGHT, worldRect));

    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(
        Math.round(screenX + screenWidth / 2),
        Math.round(screenY + screenHeight - 4),
        Math.max(10, Math.round(screenWidth * 0.22)),
        Math.max(4, Math.round(screenHeight * 0.06)),
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#cf3f3f";
    ctx.fillRect(screenX, screenY, screenWidth, screenHeight);
}

function getCurrentFrameConfig() {
    const animation = animations[direction];

    if (frame === 0) {
        return animation.idle;
    }

    return animation.walk[frame - 1] || animation.idle;
}

function getPlayerAnchor() {
    return {
        x: player.x + PLAYER_WIDTH / 2,
        y: player.y + PLAYER_HEIGHT
    };
}

function drawPlayer(worldRect) {
    const currentFrame = getCurrentFrameConfig();
    const image = assets[currentFrame.assetKey];

    if (!image.complete || !image.naturalWidth) {
        drawPlayerFallback(worldRect);
        return;
    }

    const screenX = Math.round(worldToScreenX(player.x, worldRect));
    const screenY = Math.round(worldToScreenY(player.y, worldRect));
    const screenWidth = Math.round(worldToScreenWidth(PLAYER_WIDTH, worldRect));
    const screenHeight = Math.round(worldToScreenHeight(PLAYER_HEIGHT, worldRect));

    if (currentFrame.flipX) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(image, -(screenX + screenWidth), screenY, screenWidth, screenHeight);
        ctx.restore();
        return;
    }

    ctx.drawImage(image, screenX, screenY, screenWidth, screenHeight);
}

function drawCollisionDebug(worldRect) {
    if (!SHOW_COLLISION_DEBUG) {
        return;
    }

    ctx.save();
    ctx.lineWidth = 1;

    collisionRects.forEach((obstacle) => {
        const screenX = Math.round(worldToScreenX(obstacle.x, worldRect));
        const screenY = Math.round(worldToScreenY(obstacle.y, worldRect));
        const screenWidth = Math.max(1, Math.round(worldToScreenWidth(obstacle.width, worldRect)));
        const screenHeight = Math.max(1, Math.round(worldToScreenHeight(obstacle.height, worldRect)));

        ctx.fillStyle = "rgba(255, 80, 80, 0.18)";
        ctx.strokeStyle = "rgba(255, 80, 80, 0.95)";
        ctx.fillRect(screenX, screenY, screenWidth, screenHeight);
        ctx.strokeRect(screenX + 0.5, screenY + 0.5, Math.max(0, screenWidth - 1), Math.max(0, screenHeight - 1));
    });

    const playerHitbox = getPlayerHitbox();
    const playerScreenX = Math.round(worldToScreenX(playerHitbox.x, worldRect));
    const playerScreenY = Math.round(worldToScreenY(playerHitbox.y, worldRect));
    const playerScreenWidth = Math.max(1, Math.round(worldToScreenWidth(playerHitbox.width, worldRect)));
    const playerScreenHeight = Math.max(1, Math.round(worldToScreenHeight(playerHitbox.height, worldRect)));

    ctx.strokeStyle = "rgba(0, 255, 160, 0.95)";
    ctx.strokeRect(
        playerScreenX + 0.5,
        playerScreenY + 0.5,
        Math.max(0, playerScreenWidth - 1),
        Math.max(0, playerScreenHeight - 1)
    );

    ctx.fillStyle = "rgba(8, 12, 18, 0.8)";
    ctx.fillRect(worldRect.x + 12, worldRect.y + 12, 220, 56);
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px monospace";
    ctx.textBaseline = "top";
    ctx.fillText(`Mode: ${walkableMaskData ? "white-mask + rects" : "rects"}`, worldRect.x + 20, worldRect.y + 20);
    ctx.fillText(`Player: ${Math.round(player.x)}, ${Math.round(player.y)}`, worldRect.x + 20, worldRect.y + 34);
    ctx.fillText(walkableMaskData ? "Source: bgtransitable + HsLD" : "Source: HsLD baked", worldRect.x + 20, worldRect.y + 48);

    ctx.restore();
}

function getRenderState() {
    return [
        Math.round(player.x * 100) / 100,
        Math.round(player.y * 100) / 100,
        direction,
        frame
    ].join("|");
}

function draw(force = false) {
    const worldRect = getWorldRect();

    if (backgroundDirty || force) {
        drawBackground(worldRect);
        backgroundDirty = false;
    }

    const renderState = getRenderState();

    if (!force && renderState === previousRenderState) {
        return;
    }

    ctx.clearRect(0, 0, viewport.width, viewport.height);
    drawNpc(worldRect);
    drawPlayer(worldRect);
    drawCollisionDebug(worldRect);
    previousRenderState = renderState;
}

function keyToDirection(key) {
    switch (key) {
        case "w":
        case "arrowup":
            return "up";
        case "s":
        case "arrowdown":
            return "down";
        case "a":
        case "arrowleft":
            return "left";
        case "d":
        case "arrowright":
            return "right";
        default:
            return null;
    }
}

function getActiveMovementKey() {
    return movementKeyOrder[movementKeyOrder.length - 1] || null;
}

function registerMovementKey(key) {
    if (!movementKeyOrder.includes(key)) {
        movementKeyOrder.push(key);
    }
}

function unregisterMovementKey(key) {
    const keyIndex = movementKeyOrder.indexOf(key);

    if (keyIndex >= 0) {
        movementKeyOrder.splice(keyIndex, 1);
    }
}

function movePlayerBy(dx, dy) {
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

function updateDirectionFromVector(x, y) {
    if (x === 0 && y === 0) {
        return;
    }

    if (Math.abs(x) > Math.abs(y)) {
        direction = x > 0 ? "right" : "left";
        return;
    }

    direction = y > 0 ? "down" : "up";
}

function movePlayerByDirection(deltaMs) {
    const activeKey = getActiveMovementKey();

    if (!activeKey) {
        return false;
    }

    direction = keyToDirection(activeKey) || direction;

    const distance = getCurrentMovementSpeed() * (deltaMs / 1000);

    switch (direction) {
        case "up":
            return movePlayerBy(0, -distance);
        case "down":
            return movePlayerBy(0, distance);
        case "left":
            return movePlayerBy(-distance, 0);
        case "right":
            return movePlayerBy(distance, 0);
        default:
            return false;
    }
}

function moveToTarget(deltaMs) {
    if (!target) {
        return false;
    }

    const anchor = getPlayerAnchor();
    const dx = target.x - anchor.x;
    const dy = target.y - anchor.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= CLICK_STOP_DISTANCE) {
        target = null;
        return false;
    }

    updateDirectionFromVector(dx, dy);

    const stepDistance = Math.min(distance, getCurrentMovementSpeed() * (deltaMs / 1000));

    const moved = movePlayerBy((dx / distance) * stepDistance, (dy / distance) * stepDistance);

    if (!moved) {
        target = null;
    }

    return moved;
}

function updateAnimation(isMoving, deltaMs) {
    if (!isMoving) {
        frame = 0;
        frameTimer = 0;
        return;
    }

    if (frame === 0) {
        frame = 1;
    }

    frameTimer += deltaMs;

    const frameDuration = isRunning ? RUN_FRAME_DURATION : WALK_FRAME_DURATION;

    if (frameTimer >= frameDuration) {
        frame = frame === 1 ? 2 : 1;
        frameTimer = 0;
    }
}

function getCurrentMovementSpeed() {
    return isRunning ? PLAYER_SPEED * RUN_SPEED_MULTIPLIER : PLAYER_SPEED;
}

function gameLoop(timestamp) {
    const deltaMs = lastFrameTime > 0 ? Math.max(0, timestamp - lastFrameTime) : 0;

    lastFrameTime = timestamp;

    const isMovingWithKeyboard = movePlayerByDirection(deltaMs);
    const isMoving = isMovingWithKeyboard || moveToTarget(deltaMs);
    updateAnimation(isMoving, deltaMs);
    draw();

    window.requestAnimationFrame(gameLoop);
}

function clearMovementInput() {
    movementKeyOrder.length = 0;
    target = null;
    isRunning = false;
    frame = 0;
    frameTimer = 0;
}

function handleKeyDown(event) {
    const key = event.key.toLowerCase();

    if (key === RUN_KEY) {
        isRunning = true;
        event.preventDefault();
        return;
    }

    if (!MOVEMENT_KEYS.includes(key)) {
        return;
    }

    if (!event.repeat) {
        registerMovementKey(key);
        target = null;

        const activeKey = getActiveMovementKey();

        if (activeKey) {
            direction = keyToDirection(activeKey) || direction;
        }
    }

    event.preventDefault();
}

function handleKeyUp(event) {
    const key = event.key.toLowerCase();

    if (key === RUN_KEY) {
        isRunning = false;
        event.preventDefault();
        return;
    }

    if (!MOVEMENT_KEYS.includes(key)) {
        return;
    }

    unregisterMovementKey(key);

    const activeKey = getActiveMovementKey();

    if (activeKey) {
        direction = keyToDirection(activeKey) || direction;
    }

    event.preventDefault();
}

function startScene() {
    resizeCanvas();
    placePlayerAtRoomCenter();
    draw(true);
    lastFrameTime = performance.now();
    window.requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);

window.addEventListener("resize", () => {
    resizeCanvas();
    draw(true);
});

window.addEventListener("pointerdown", () => {
    gameCanvas.focus();
});

gameCanvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
        return;
    }

    const rect = gameCanvas.getBoundingClientRect();
    const worldRect = getWorldRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    target = screenToWorldPoint(clickX, clickY, worldRect);
    const anchor = getPlayerAnchor();
    updateDirectionFromVector(target.x - anchor.x, target.y - anchor.y);
    event.preventDefault();
});

window.addEventListener("blur", () => {
    clearMovementInput();
    draw(true);
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        lastFrameTime = performance.now();
        return;
    }

    clearMovementInput();
});

startScene();
gameCanvas.focus();
