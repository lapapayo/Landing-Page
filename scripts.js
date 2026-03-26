const backgroundCanvas = document.getElementById("backgroundCanvas");
const backgroundCtx = backgroundCanvas.getContext("2d");
const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d");

gameCanvas.tabIndex = 0;

const WORLD_WIDTH = 1920;
const WORLD_HEIGHT = 1080;
const WORLD_STEP = 4;
const WORLD_RUN_STEP = 7;
const PLAYER_WIDTH = 96;
const PLAYER_HEIGHT = 114;
const PLAYER_FOOT_HITBOX = {
    width: 16,
    height: 8
};
const COLLISION_ALPHA_THRESHOLD = 16;

const viewport = {
    dpr: window.devicePixelRatio || 1,
    width: window.innerWidth,
    height: window.innerHeight
};

const keys = {};
let target = null;
let direction = "down";
let frame = 0;
let frameTimer = 0;
let interactionRequested = false;
let collisionMaskData = null;

const player = {
    x: 0,
    y: 0,
    speed: WORLD_STEP,
    runSpeed: WORLD_RUN_STEP
};

backgroundCtx.imageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

function loadSprite(src) {
    const image = new Image();
    image.src = src;
    return image;
}

const assets = {
    background: loadSprite("bg.png"),
    collisionMask: loadSprite("HsBG/HsLD.png"),
    nurseJoy: loadSprite("Spritesnpcs/joynurses.png"),
    playerDownIdle: loadSprite("Spritesheet/abajoquieto.png"),
    playerDownWalk1: loadSprite("Spritesheet/abajoandando1.png"),
    playerUpIdle: loadSprite("Spritesheet/arribaquieto.png"),
    playerUpWalk1: loadSprite("Spritesheet/arribaandando1.png"),
    playerLeftIdle: loadSprite("Spritesheet/izquierdaquieto.png"),
    playerLeftWalk1: loadSprite("Spritesheet/izquierdaandando1.png"),
    playerLeftWalk2: loadSprite("Spritesheet/izquierdandando2.png")
};

Object.values(assets).forEach((image) => {
    image.addEventListener("load", () => {
        draw();
    });
});

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

const npc = {
    joy: {
        x: 840,
        y: 138,
        width: 72,
        height: 96
    }
};

assets.collisionMask.addEventListener("load", cacheCollisionMaskData);

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
}

function cacheCollisionMaskData() {
    const image = assets.collisionMask;

    if (!image.complete || !image.naturalWidth) {
        collisionMaskData = null;
        return;
    }

    try {
        const buffer = document.createElement("canvas");
        const bufferCtx = buffer.getContext("2d", { willReadFrequently: true });

        buffer.width = image.naturalWidth;
        buffer.height = image.naturalHeight;
        bufferCtx.clearRect(0, 0, buffer.width, buffer.height);
        bufferCtx.drawImage(image, 0, 0);
        collisionMaskData = bufferCtx.getImageData(0, 0, buffer.width, buffer.height);
    } catch (error) {
        console.error("No se pudo leer la mascara de colision HsLD.png:", error);
        collisionMaskData = null;
    }
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

function getCurrentFrameConfig() {
    const currentAnimation = animations[direction];
    return currentAnimation[frame] || currentAnimation[0];
}

function getPlayerFootHitbox(nextX = player.x, nextY = player.y) {
    return {
        x: nextX + (PLAYER_WIDTH - PLAYER_FOOT_HITBOX.width) / 2,
        y: nextY + PLAYER_HEIGHT - PLAYER_FOOT_HITBOX.height,
        width: PLAYER_FOOT_HITBOX.width,
        height: PLAYER_FOOT_HITBOX.height
    };
}

function isCollisionPixelSolid(worldX, worldY) {
    if (!collisionMaskData) {
        return false;
    }

    const x = Math.floor(worldX);
    const y = Math.floor(worldY);

    if (x < 0 || y < 0 || x >= collisionMaskData.width || y >= collisionMaskData.height) {
        return true;
    }

    const alpha = collisionMaskData.data[(y * collisionMaskData.width + x) * 4 + 3];
    return alpha >= COLLISION_ALPHA_THRESHOLD;
}

function footHitboxTouchesCollisionMask(hitbox) {
    const left = Math.floor(hitbox.x) + 1;
    const center = Math.floor(hitbox.x + hitbox.width / 2);
    const right = Math.ceil(hitbox.x + hitbox.width) - 2;
    const bottom = Math.ceil(hitbox.y + hitbox.height) - 1;
    const upper = Math.floor(hitbox.y + 1);

    return (
        isCollisionPixelSolid(left, bottom) ||
        isCollisionPixelSolid(center, bottom) ||
        isCollisionPixelSolid(right, bottom) ||
        isCollisionPixelSolid(left, upper) ||
        isCollisionPixelSolid(right, upper)
    );
}

function canMoveTo(nextX, nextY) {
    if (!collisionMaskData && assets.collisionMask.complete && assets.collisionMask.naturalWidth) {
        cacheCollisionMaskData();
    }

    if (
        nextX < 0 ||
        nextY < 0 ||
        nextX + PLAYER_WIDTH > WORLD_WIDTH ||
        nextY + PLAYER_HEIGHT > WORLD_HEIGHT
    ) {
        return false;
    }

    return !footHitboxTouchesCollisionMask(getPlayerFootHitbox(nextX, nextY));
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
    const preferredX = Math.round(WORLD_WIDTH / 2 - PLAYER_WIDTH / 2);
    const preferredY = Math.round(WORLD_HEIGHT / 2 - PLAYER_HEIGHT / 2);

    if (canMoveTo(preferredX, preferredY)) {
        return { x: preferredX, y: preferredY };
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

function drawBackground(worldRect) {
    return;
}

function drawNpc(worldRect) {
    const joy = npc.joy;

    if (!assets.nurseJoy.complete || !assets.nurseJoy.naturalWidth) {
        return;
    }

    const screenX = Math.round(worldToScreenX(joy.x, worldRect));
    const screenY = Math.round(worldToScreenY(joy.y, worldRect));
    const screenWidth = Math.round(worldToScreenWidth(joy.width, worldRect));
    const screenHeight = Math.round(worldToScreenHeight(joy.height, worldRect));

    ctx.drawImage(assets.nurseJoy, screenX, screenY, screenWidth, screenHeight);
}

function drawPlayerFallback(worldRect) {
    const screenX = Math.round(worldToScreenX(player.x, worldRect));
    const screenY = Math.round(worldToScreenY(player.y, worldRect));
    const screenWidth = Math.round(worldToScreenWidth(PLAYER_WIDTH, worldRect));
    const screenHeight = Math.round(worldToScreenHeight(PLAYER_HEIGHT, worldRect));
    const headSize = Math.max(8, Math.round(screenWidth * 0.35));
    const bodyWidth = Math.max(10, Math.round(screenWidth * 0.42));
    const bodyHeight = Math.max(16, Math.round(screenHeight * 0.38));
    const headX = Math.round(screenX + (screenWidth - headSize) / 2);
    const headY = Math.round(screenY + 6);
    const bodyX = Math.round(screenX + (screenWidth - bodyWidth) / 2);
    const bodyY = headY + headSize - 2;

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

    ctx.fillStyle = "#2b2b2b";
    ctx.fillRect(bodyX - 2, bodyY - 2, bodyWidth + 4, bodyHeight + 4);
    ctx.fillRect(headX - 2, headY - 2, headSize + 4, headSize + 4);

    ctx.fillStyle = "#f2c094";
    ctx.fillRect(headX, headY, headSize, headSize);
    ctx.fillStyle = "#cf3f3f";
    ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);
    ctx.fillStyle = "#2755d8";
    ctx.fillRect(bodyX + 2, bodyY + bodyHeight, Math.round(bodyWidth / 2) - 3, Math.max(10, Math.round(screenHeight * 0.18)));
    ctx.fillRect(bodyX + Math.round(bodyWidth / 2) + 1, bodyY + bodyHeight, Math.round(bodyWidth / 2) - 3, Math.max(10, Math.round(screenHeight * 0.18)));
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

function draw() {
    ctx.clearRect(0, 0, viewport.width, viewport.height);

    const worldRect = getWorldRect();
    drawBackground(worldRect);
    drawNpc(worldRect);
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
}

function gameLoop() {
    const movingKeyboard = moveKeyboard();
    const movingMouse = moveToTarget();

    tryInteract();
    updateAnimation(movingKeyboard || movingMouse);
    draw();

    window.requestAnimationFrame(gameLoop);
}

function startGame() {
    resizeCanvas();
    cacheCollisionMaskData();
    placePlayerAtRoomCenter();
    draw();
    gameLoop();
}

function handleKeyDown(event) {
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
}

function handleKeyUp(event) {
    const key = event.key.toLowerCase();

    if (["w", "a", "s", "d", "z", "c", "enter", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(key)) {
        keys[key] = false;
        event.preventDefault();
    }
}

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);

gameCanvas.addEventListener("click", (event) => {
    gameCanvas.focus();

    const rect = gameCanvas.getBoundingClientRect();
    const worldRect = getWorldRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    target = screenToWorldPoint(clickX, clickY, worldRect);
});

window.addEventListener("pointerdown", () => {
    gameCanvas.focus();
});

window.addEventListener("resize", () => {
    resizeCanvas();
    draw();
});

startGame();
gameCanvas.focus();
