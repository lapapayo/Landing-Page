const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const DPR = window.devicePixelRatio || 1;

ctx.imageSmoothingEnabled = false;

function resizeCanvas() {
    canvas.width = Math.floor(window.innerWidth * DPR);
    canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = false;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// 🎮 Jugador
const player = {
    x: 200,
    y: 200,
    speed: 2,
    runSpeed: 4
};

let frame = 0;
let frameTimer = 0;
let direction = "down";
const IDLE_FRAME = 0;
const WALK_FRAME = 1;
const PLAYER_SCALE = 4;
const bgImage = loadSprite("bg.png");
const nurseJoyImage = loadSprite("Spritesnpcs/joynurses.png");
const nurseJoy = {
    x: 720,
    y: 192,
    width: 112,
    height: 114
};

const collisionAreas = [
    { x: 423, y: 204, width: 735, height: 233 },
    { x: 88, y: 89, width: 325, height: 188 },
    { x: 1166, y: 70, width: 146, height: 210 },
    { x: 401, y: 270, width: 92, height: 91 },
    { x: 1049, y: 271, width: 92, height: 91 },
    { x: 252, y: 660, width: 116, height: 62 },
    { x: 252, y: 722, width: 44, height: 131 },
    { x: 324, y: 722, width: 44, height: 131 },
    { x: 1165, y: 661, width: 115, height: 62 },
    { x: 1165, y: 723, width: 44, height: 130 },
    { x: 1236, y: 723, width: 44, height: 130 }
];

function loadSprite(src) {
    const image = new Image();
    image.src = src;
    return image;
}

const spriteImages = {
    downIdle: loadSprite("Spritesheet/abajoquieto.png"),
    downWalk1: loadSprite("Spritesheet/abajoandando1.png"),
    upIdle: loadSprite("Spritesheet/arribaquieto.png"),
    upWalk1: loadSprite("Spritesheet/arribaandando1.png"),
    leftIdle: loadSprite("Spritesheet/izquierdaquieto.png"),
    leftWalk1: loadSprite("Spritesheet/izquierdaandando1.png"),
    leftWalk2: loadSprite("Spritesheet/izquierdandando2.png")
};

const animations = {
    down: [
        { image: spriteImages.downIdle, flipX: false },
        { image: spriteImages.downWalk1, flipX: false },
        { image: spriteImages.downWalk1, flipX: true }
    ],
    up: [
        { image: spriteImages.upIdle, flipX: false },
        { image: spriteImages.upWalk1, flipX: false },
        { image: spriteImages.upWalk1, flipX: true }
    ],
    left: [
        { image: spriteImages.leftIdle, flipX: false },
        { image: spriteImages.leftWalk1, flipX: false },
        { image: spriteImages.leftWalk2, flipX: false }
    ],
    right: [
        { image: spriteImages.leftIdle, flipX: true },
        { image: spriteImages.leftWalk1, flipX: true },
        { image: spriteImages.leftWalk2, flipX: true }
    ]
};

function getBackgroundRect() {
    const imageRatio = bgImage.width / bgImage.height;
    const viewportWidth = canvas.width / DPR;
    const viewportHeight = canvas.height / DPR;
    const canvasRatio = viewportWidth / viewportHeight;

    let drawWidth;
    let drawHeight;

    if (canvasRatio > imageRatio) {
        drawHeight = viewportHeight;
        drawWidth = drawHeight * imageRatio;
    } else {
        drawWidth = viewportWidth;
        drawHeight = drawWidth / imageRatio;
    }

    return {
        x: Math.round((viewportWidth - drawWidth) / 2),
        y: Math.round((viewportHeight - drawHeight) / 2),
        width: Math.round(drawWidth),
        height: Math.round(drawHeight)
    };
}

function scaleRect(rect, bgRect) {
    return {
        x: Math.round(bgRect.x + (rect.x / bgImage.width) * bgRect.width),
        y: Math.round(bgRect.y + (rect.y / bgImage.height) * bgRect.height),
        width: Math.round((rect.width / bgImage.width) * bgRect.width),
        height: Math.round((rect.height / bgImage.height) * bgRect.height)
    };
}

function drawNurseJoy(bgRect) {
    if (!nurseJoyImage.complete || !nurseJoyImage.naturalWidth) {
        return;
    }

    ctx.imageSmoothingEnabled = false;
    const spriteScale = 1;
    const drawWidth = nurseJoyImage.naturalWidth * spriteScale;
    const drawHeight = nurseJoyImage.naturalHeight * spriteScale;
    const anchorX = bgRect.x + (nurseJoy.x / bgImage.width) * bgRect.width;
    const anchorY = bgRect.y + (nurseJoy.y / bgImage.height) * bgRect.height;

    ctx.drawImage(
        nurseJoyImage,
        Math.round(anchorX),
        Math.round(anchorY),
        drawWidth,
        drawHeight
    );
}

function getPlayerHitbox(nextX = player.x, nextY = player.y) {
    const currentAnimation = animations[direction];
    const currentFrame = currentAnimation[frame] || currentAnimation[IDLE_FRAME];
    const currentSprite = currentFrame.image;
    const drawWidth = Math.round(currentSprite.width * PLAYER_SCALE);
    const drawHeight = Math.round(currentSprite.height * PLAYER_SCALE);

    return {
        x: nextX + drawWidth * 0.3,
        y: nextY + drawHeight * 0.64,
        width: drawWidth * 0.4,
        height: drawHeight * 0.28
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

function canMoveTo(nextX, nextY) {
    if (!bgImage.complete || !bgImage.naturalWidth) {
        return true;
    }

    const bgRect = getBackgroundRect();
    const hitbox = getPlayerHitbox(nextX, nextY);

    if (
        hitbox.x < bgRect.x ||
        hitbox.y < bgRect.y ||
        hitbox.x + hitbox.width > bgRect.x + bgRect.width ||
        hitbox.y + hitbox.height > bgRect.y + bgRect.height
    ) {
        return false;
    }

    return !collisionAreas.some((area) => intersects(hitbox, scaleRect(area, bgRect)));
}

function movePlayer(dx, dy) {
    let moved = false;

    if (dx !== 0 && canMoveTo(player.x + dx, player.y)) {
        player.x += dx;
        moved = true;
    }

    if (dy !== 0 && canMoveTo(player.x, player.y + dy)) {
        player.y += dy;
        moved = true;
    }

    return moved;
}

function getCenteredSpawnPosition() {
    const idleSprite = spriteImages.downIdle;

    if (!bgImage.complete || !bgImage.naturalWidth || !idleSprite.complete || !idleSprite.naturalWidth) {
        return { x: player.x, y: player.y };
    }

    const bgRect = getBackgroundRect();
    const drawWidth = Math.round(idleSprite.width * PLAYER_SCALE);
    const drawHeight = Math.round(idleSprite.height * PLAYER_SCALE);
    const preferredX = Math.round(bgRect.x + bgRect.width / 2 - drawWidth / 2);
    const preferredY = Math.round(bgRect.y + bgRect.height / 2 - drawHeight / 2);

    if (canMoveTo(preferredX, preferredY)) {
        return { x: preferredX, y: preferredY };
    }

    const step = 8;
    const maxRadius = Math.ceil(Math.max(bgRect.width, bgRect.height) / step);

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

// 🎹 Teclas
const keys = {};

document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();

    if (["w", "a", "s", "d", "z", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(key)) {
        keys[key] = true;
        if (["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(key)) {
            target = null;
        }
        e.preventDefault();
    }
});

document.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();

    if (["w", "a", "s", "d", "z", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(key)) {
        keys[key] = false;
        e.preventDefault();
    }
});

// 🖱️ Click para moverse
let target = null;

canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    target = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
});

// 🎮 Movimiento WASD
function moveKeyboard() {
    const currentSpeed = keys["z"] ? player.runSpeed : player.speed;

    if (keys["w"] || keys["arrowup"]) {
        direction = "up";
        return movePlayer(0, -currentSpeed);
    }

    if (keys["s"] || keys["arrowdown"]) {
        direction = "down";
        return movePlayer(0, currentSpeed);
    }

    if (keys["a"] || keys["arrowleft"]) {
        direction = "left";
        return movePlayer(-currentSpeed, 0);
    }

    if (keys["d"] || keys["arrowright"]) {
        direction = "right";
        return movePlayer(currentSpeed, 0);
    }

    return false;
}

// 🖱️ Movimiento hacia click
function moveToTarget() {
    if (!target) return false;

    let dx = target.x - player.x;
    let dy = target.y - player.y;

    let dist = Math.hypot(dx, dy);

    if (dist > 2) {
        const moveX = (dx / dist) * player.speed;
        const moveY = (dy / dist) * player.speed;

        // Dirección automática
        if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? "right" : "left";
        } else {
            direction = dy > 0 ? "down" : "up";
        }

        return movePlayer(moveX, moveY);
    }

    target = null;
    return false;
}

// 🎞️ Animación
function updateAnimation(isMoving) {
    if (isMoving) {
        frameTimer++;
        if (frameTimer > 10) {
            const currentAnimation = animations[direction];
            frame = (frame + 1) % currentAnimation.length;
            frameTimer = 0;
        }
    } else {
        frame = IDLE_FRAME;
        frameTimer = 0;
    }
}

// 🖼️ Dibujar
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgImage.complete) {
        const bgRect = getBackgroundRect();
        ctx.drawImage(bgImage, bgRect.x, bgRect.y, bgRect.width, bgRect.height);
        drawNurseJoy(bgRect);
    }

    const currentAnimation = animations[direction];
    const currentFrame = currentAnimation[frame] || currentAnimation[IDLE_FRAME];
    const currentSprite = currentFrame.image;

    if (!currentSprite || !currentSprite.complete) {
        return;
    }

    const drawWidth = Math.round(currentSprite.width * PLAYER_SCALE);
    const drawHeight = Math.round(currentSprite.height * PLAYER_SCALE);
    const drawX = Math.round(player.x);
    const drawY = Math.round(player.y);

    if (currentFrame.flipX) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(
            currentSprite,
            -(drawX + drawWidth),
            drawY,
            drawWidth,
            drawHeight
        );
        ctx.restore();
        return;
    }

    ctx.drawImage(
        currentSprite,
        drawX,
        drawY,
        drawWidth,
        drawHeight
    );
}

// 🔄 Loop principal
function gameLoop() {
    const movingKeyboard = moveKeyboard();
    const movingMouse = moveToTarget();

    updateAnimation(movingKeyboard || movingMouse);
    draw();

    requestAnimationFrame(gameLoop);
}

const allSprites = [bgImage, nurseJoyImage, ...Object.values(spriteImages)];
let loadedSprites = 0;

allSprites.forEach((image) => {
    image.onload = () => {
        loadedSprites++;

        if (loadedSprites === allSprites.length) {
            placePlayerAtRoomCenter();
            gameLoop();
        }
    };
});
