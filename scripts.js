const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 🎮 Jugador
const player = {
    x: 200,
    y: 200,
    speed: 2
};

// 🖼️ Sprite
const sprite = new Image();
sprite.src = "sprite.png"; // ← TU SPRITE SHEET

const FRAME_WIDTH = 32;
const FRAME_HEIGHT = 32;

let frame = 0;
let frameTimer = 0;
let direction = 0; // 0 abajo, 1 izquierda, 2 derecha, 3 arriba

// 🎹 Teclas
const keys = {};

document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

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
    let moving = false;

    if (keys["w"]) {
        player.y -= player.speed;
        direction = 3;
        moving = true;
    }
    if (keys["s"]) {
        player.y += player.speed;
        direction = 0;
        moving = true;
    }
    if (keys["a"]) {
        player.x -= player.speed;
        direction = 1;
        moving = true;
    }
    if (keys["d"]) {
        player.x += player.speed;
        direction = 2;
        moving = true;
    }

    return moving;
}

// 🖱️ Movimiento hacia click
function moveToTarget() {
    if (!target) return false;

    let dx = target.x - player.x;
    let dy = target.y - player.y;

    let dist = Math.hypot(dx, dy);

    if (dist > 2) {
        player.x += (dx / dist) * player.speed;
        player.y += (dy / dist) * player.speed;

        // Dirección automática
        if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? 2 : 1;
        } else {
            direction = dy > 0 ? 0 : 3;
        }

        return true;
    }

    return false;
}

// 🎞️ Animación
function updateAnimation(isMoving) {
    if (isMoving) {
        frameTimer++;
        if (frameTimer > 10) {
            frame = (frame + 1) % 4;
            frameTimer = 0;
        }
    } else {
        frame = 0;
    }
}

// 🖼️ Dibujar
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
        sprite,
        frame * FRAME_WIDTH,
        direction * FRAME_HEIGHT,
        FRAME_WIDTH,
        FRAME_HEIGHT,
        player.x,
        player.y,
        FRAME_WIDTH * 2,
        FRAME_HEIGHT * 2
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

sprite.onload = () => {
    gameLoop();
};