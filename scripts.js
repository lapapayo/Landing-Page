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
const SHOW_WALKABLE_BOUNDARY = true;
const RUN_KEY = "z";
const ASSET_VERSION = Date.now();

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

const PRECOMPUTED_COLLISION_RECTS = "0,0,1920,242;0,242,237,2;256,242,1154,1;1418,242,119,61;1546,242,374,1;268,243,1142,6;1794,243,126,1;0,244,137,1;142,244,95,1;1795,244,125,1;0,245,136,1;146,245,91,1;1796,245,124,1;0,246,135,1;150,246,87,1;1797,246,123,1;0,247,133,1;154,247,83,1;1798,247,122,1;0,248,132,1;156,248,81,1;1799,248,121,1;0,249,131,1;156,249,80,7;268,249,241,58;516,249,894,24;1800,249,120,1;0,250,130,1;1802,250,118,1;0,251,128,1;1803,251,117,1;0,252,127,1;1804,252,116,1;0,253,126,1;1805,253,115,1;0,254,125,1;1806,254,114,1;0,255,123,1;1807,255,113,1;0,256,122,1;156,256,79,7;1808,256,112,1;0,257,121,1;1809,257,111,1;0,258,120,1;1811,258,109,1;0,259,118,1;1812,259,108,1;0,260,117,1;1813,260,107,1;0,261,116,1;1814,261,106,1;0,262,115,1;1815,262,105,1;0,263,113,1;156,263,78,1;1816,263,104,1;0,264,112,1;157,264,77,5;1817,264,103,1;0,265,111,1;1819,265,101,1;0,266,110,1;1820,266,100,1;0,267,108,1;1821,267,99,1;0,268,107,1;1822,268,98,1;0,269,106,1;158,269,76,1;1823,269,97,1;0,270,105,1;158,270,75,5;1824,270,96,1;0,271,103,1;1825,271,95,1;0,272,102,1;1827,272,93,1;0,273,101,1;516,273,893,18;1828,273,92,1;0,274,100,1;1829,274,91,1;0,275,98,1;159,275,74,1;1830,275,90,1;0,276,97,1;160,276,73,1;1831,276,89,1;0,277,96,1;161,277,71,1;1832,277,88,1;0,278,95,1;162,278,70,2;1833,278,87,1;0,279,93,1;1834,279,86,1;0,280,92,1;163,280,69,1;1836,280,84,1;0,281,91,1;164,281,68,1;1837,281,83,1;0,282,90,1;165,282,67,1;1838,282,82,1;0,283,88,1;166,283,66,1;1839,283,81,1;0,284,87,1;167,284,64,1;1840,284,80,1;0,285,86,1;168,285,61,1;1841,285,79,1;0,286,85,1;169,286,58,1;1842,286,78,1;0,287,83,1;170,287,56,1;1844,287,76,1;0,288,82,1;171,288,53,1;1845,288,75,1;0,289,81,1;172,289,51,1;1846,289,74,1;0,290,80,1;173,290,48,1;1847,290,73,1;0,291,78,1;174,291,46,1;517,291,892,15;1848,291,72,1;0,292,77,1;175,292,43,1;1849,292,71,1;0,293,76,1;176,293,40,1;1850,293,70,1;0,294,75,1;177,294,38,1;1852,294,68,1;0,295,73,1;178,295,29,1;1853,295,67,1;0,296,72,1;182,296,17,1;1854,296,66,1;0,297,71,1;1855,297,65,1;0,298,70,1;1856,298,64,1;0,299,68,1;1857,299,63,1;0,300,67,1;1858,300,62,1;0,301,66,1;1859,301,61,1;0,302,65,1;1861,302,59,1;0,303,63,1;1862,303,58,1;0,304,62,1;1863,304,57,1;0,305,61,1;1864,305,56,1;0,306,60,1;517,306,891,28;1865,306,55,1;0,307,58,1;1866,307,54,1;0,308,57,1;1867,308,53,1;0,309,56,1;1869,309,51,1;0,310,55,1;1870,310,50,1;0,311,53,1;1871,311,49,1;0,312,52,1;1872,312,48,1;0,313,51,1;1873,313,47,1;0,314,50,1;1874,314,46,1;0,315,48,1;1875,315,45,1;0,316,47,1;1877,316,43,1;0,317,46,1;329,317,1,1;1878,317,42,1;0,318,45,1;1879,318,41,1;0,319,43,1;1880,319,40,1;0,320,42,1;1881,320,39,1;0,321,41,1;1882,321,38,1;0,322,40,1;1883,322,37,1;0,323,38,1;1884,323,36,1;0,324,37,1;1886,324,34,1;0,325,36,1;1887,325,33,1;0,326,35,1;1888,326,32,1;0,327,33,1;1889,327,31,1;0,328,32,1;1890,328,30,1;0,329,31,1;1891,329,29,1;0,330,30,1;1892,330,28,1;0,331,28,1;1894,331,26,1;0,332,27,1;1895,332,25,1;0,333,26,1;1896,333,24,1;0,334,25,1;518,334,890,4;1897,334,23,1;0,335,23,1;1898,335,22,1;0,336,22,1;1899,336,21,1;0,337,21,1;1900,337,20,1;0,338,20,1;518,338,889,32;1902,338,18,1;0,339,18,576;1903,339,17,1;1904,340,16,1;1905,341,15,1;1906,342,14,1;1907,343,13,46;518,370,888,6;519,376,887,26;1906,389,14,270;519,402,886,17;520,419,885,16;520,435,884,2;520,437,883,1;520,438,882,1;520,439,881,1;520,440,880,1;520,441,879,1;521,442,878,1;521,443,877,1;522,444,875,1;523,445,873,1;524,446,871,1;524,447,870,1;525,448,869,1;526,449,867,1;526,450,866,1;527,451,864,1;528,452,862,1;529,453,860,2;530,455,858,1;531,456,856,1;531,457,855,1;532,458,853,1;533,459,851,1;534,460,850,1;534,461,849,1;1905,659,15,262;268,707,240,66;1418,707,247,204;268,773,241,77;269,850,240,61;329,911,2,1;0,915,20,1;0,916,21,1;0,917,22,1;0,918,23,1;0,919,24,1;0,920,25,1;0,921,26,1;1903,921,17,1;0,922,27,1;1902,922,18,1;0,923,29,1;1901,923,19,1;0,924,30,1;1900,924,20,1;0,925,31,1;1899,925,21,1;0,926,32,1;1898,926,22,1;0,927,33,1;1896,927,24,1;0,928,34,1;1895,928,25,1;0,929,35,1;1894,929,26,1;0,930,36,1;1893,930,27,1;0,931,37,1;1892,931,28,1;0,932,39,1;1891,932,29,1;0,933,40,1;1889,933,31,1;0,934,41,1;1888,934,32,1;0,935,42,1;1887,935,33,1;0,936,43,1;1886,936,34,1;0,937,44,1;1885,937,35,1;0,938,45,1;1884,938,36,1;0,939,46,1;1882,939,38,1;0,940,48,1;1881,940,39,1;0,941,49,1;1880,941,40,1;0,942,50,1;1879,942,41,1;0,943,51,1;1878,943,42,1;0,944,52,1;1877,944,43,1;0,945,53,1;1875,945,45,1;0,946,54,1;1874,946,46,1;0,947,55,1;1873,947,47,1;0,948,56,1;1872,948,48,1;0,949,58,1;1871,949,49,1;0,950,59,1;1869,950,51,1;0,951,60,1;1868,951,52,1;0,952,61,1;1867,952,53,1;0,953,62,1;1866,953,54,1;0,954,63,1;1865,954,55,1;0,955,64,1;1864,955,56,1;0,956,65,1;1862,956,58,1;0,957,67,1;1861,957,59,1;0,958,68,1;1860,958,60,1;0,959,69,1;1859,959,61,1;0,960,70,1;1858,960,62,1;0,961,71,1;1857,961,63,1;0,962,72,1;1855,962,65,1;0,963,73,1;1854,963,66,1;0,964,74,1;1853,964,67,1;0,965,76,1;1852,965,68,1;0,966,77,1;1851,966,69,1;0,967,78,1;1850,967,70,1;0,968,79,1;1848,968,72,1;0,969,80,1;1847,969,73,1;0,970,81,1;1846,970,74,1;0,971,82,1;1845,971,75,1;0,972,83,1;1844,972,76,1;0,973,84,1;1843,973,77,1;0,974,86,1;1841,974,79,1;0,975,87,1;1840,975,80,1;0,976,88,1;1839,976,81,1;0,977,89,1;1838,977,82,1;0,978,90,1;1837,978,83,1;0,979,91,1;1836,979,84,1;0,980,92,1;1834,980,86,1;0,981,93,1;1833,981,87,1;0,982,95,1;1832,982,88,1;0,983,96,1;1831,983,89,1;0,984,97,1;1830,984,90,1;0,985,98,1;1829,985,91,1;0,986,99,1;1827,986,93,1;0,987,100,1;1826,987,94,1;0,988,101,1;1825,988,95,1;0,989,102,1;1824,989,96,1;0,990,104,1;1823,990,97,1;0,991,105,1;1822,991,98,1;0,992,106,1;1820,992,100,1;0,993,107,1;1819,993,101,1;0,994,108,1;1818,994,102,1;0,995,109,1;1817,995,103,1;0,996,110,1;1816,996,104,1;0,997,111,1;1815,997,105,1;0,998,112,1;1813,998,107,1;0,999,114,1;1812,999,108,1;0,1000,115,1;1811,1000,109,1;0,1001,116,1;1810,1001,110,1;0,1002,117,1;1809,1002,111,1;0,1003,118,1;1808,1003,112,1;0,1004,119,1;1806,1004,114,1;0,1005,120,1;1805,1005,115,1;0,1006,121,1;1804,1006,116,1;0,1007,123,1;1803,1007,117,1;0,1008,124,1;1802,1008,118,1;0,1009,125,1;1801,1009,119,1;0,1010,126,1;1799,1010,121,1;0,1011,127,1;1798,1011,122,1;0,1012,128,1;1797,1012,123,1;0,1013,129,1;1796,1013,124,1;0,1014,130,1;1795,1014,125,1;0,1015,388,1;1793,1015,127,1;0,1016,942,1;1792,1016,128,1;0,1017,1495,1;1791,1017,129,1;0,1018,1920,62"
    .split(";")
    .map((entry) => {
        const [x, y, width, height] = entry.split(",").map(Number);
        return { x, y, width, height };
    });

let backgroundDirty = true;
let previousRenderState = "";
let lastFrameTime = 0;
let direction = "down";
let frame = 0;
let frameTimer = 0;
let target = null;
let isRunning = false;
let collisionMaskData = null;
let collisionMapLoadState = "precomputed";
let collisionBoundaryCanvas = null;
const collisionRects = PRECOMPUTED_COLLISION_RECTS;
const movementKeyOrder = [];

backgroundCtx.imageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

function loadSprite(src) {
    const image = new Image();
    const separator = src.includes("?") ? "&" : "?";
    image.src = `${src}${separator}v=${ASSET_VERSION}`;
    return image;
}

const assets = {
    background: loadSprite("bg.png"),
    collisionMap: loadSprite("HsBG/bgfinal.png"),
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

    if (image === assets.collisionMap) {
        cacheCollisionMap();
    }

    draw(true);
}

function cacheCollisionMap() {
    if (!assets.collisionMap.complete || !assets.collisionMap.naturalWidth) {
        collisionMaskData = null;
        collisionBoundaryCanvas = null;
        collisionMapLoadState = "pending image";
        return;
    }

    try {
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = assets.collisionMap.naturalWidth;
        maskCanvas.height = assets.collisionMap.naturalHeight;

        const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
        maskCtx.imageSmoothingEnabled = false;
        maskCtx.drawImage(assets.collisionMap, 0, 0);
        collisionMaskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        cacheCollisionBoundary();
        collisionMapLoadState = "image + precalc";
    } catch (error) {
        collisionMaskData = null;
        collisionBoundaryCanvas = null;
        collisionMapLoadState = "precalc only";
        console.warn("No se pudo leer bgfinal.png para el debug por pixeles:", error);
    }

    backgroundDirty = true;

    if (!canMoveTo(player.x, player.y)) {
        placePlayerAtRoomCenter();
    }
}

function isCollisionMaskColor(data, pixelIndex) {
    const alpha = data[pixelIndex + 3];

    // In bgfinal, only transparent pixels are walkable.
    return alpha > 0;
}

function cacheCollisionBoundary() {
    if (!collisionMaskData) {
        collisionBoundaryCanvas = null;
        return;
    }

    const boundaryCanvas = document.createElement("canvas");
    boundaryCanvas.width = collisionMaskData.width;
    boundaryCanvas.height = collisionMaskData.height;

    const boundaryCtx = boundaryCanvas.getContext("2d");
    const boundaryImageData = boundaryCtx.createImageData(boundaryCanvas.width, boundaryCanvas.height);
    const sourceData = collisionMaskData.data;
    const boundaryData = boundaryImageData.data;
    const rowStride = boundaryCanvas.width * 4;

    for (let y = 0; y < boundaryCanvas.height; y++) {
        for (let x = 0; x < boundaryCanvas.width; x++) {
            const pixelIndex = (y * boundaryCanvas.width + x) * 4;

            if (!isCollisionMaskColor(sourceData, pixelIndex)) {
                continue;
            }

            const touchesOutside =
                x === 0 ||
                y === 0 ||
                x === boundaryCanvas.width - 1 ||
                y === boundaryCanvas.height - 1 ||
                !isCollisionMaskColor(sourceData, pixelIndex - 4) ||
                !isCollisionMaskColor(sourceData, pixelIndex + 4) ||
                !isCollisionMaskColor(sourceData, pixelIndex - rowStride) ||
                !isCollisionMaskColor(sourceData, pixelIndex + rowStride);

            if (!touchesOutside) {
                continue;
            }

            boundaryData[pixelIndex] = 255;
            boundaryData[pixelIndex + 1] = 244;
            boundaryData[pixelIndex + 2] = 92;
            boundaryData[pixelIndex + 3] = 255;
        }
    }

    boundaryCtx.putImageData(boundaryImageData, 0, 0);
    collisionBoundaryCanvas = boundaryCanvas;
}

Object.values(assets).forEach((image) => {
    image.addEventListener("load", () => {
        handleAssetReady(image);
    });

    image.addEventListener("error", () => {
        if (image === assets.collisionMap) {
            collisionMaskData = null;
            collisionBoundaryCanvas = null;
            collisionMapLoadState = "image error";
        }

        draw(true);
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

function collidesWithRects(hitbox, rects) {
    return rects.some((obstacle) => rectanglesOverlap(hitbox, obstacle));
}

function collidesWithCollisionMask(hitbox) {
    return collidesWithRects(hitbox, collisionRects);
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
    return !collidesWithCollisionMask(playerHitbox);
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

    if (SHOW_WALKABLE_BOUNDARY && collisionBoundaryCanvas) {
        backgroundCtx.drawImage(
            collisionBoundaryCanvas,
            worldRect.x,
            worldRect.y,
            worldRect.width,
            worldRect.height
        );
    }
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

    if (assets.collisionMap.complete && assets.collisionMap.naturalWidth) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.drawImage(
            assets.collisionMap,
            worldRect.x,
            worldRect.y,
            worldRect.width,
            worldRect.height
        );
        ctx.restore();
    }

    if (collisionBoundaryCanvas) {
        ctx.drawImage(
            collisionBoundaryCanvas,
            worldRect.x,
            worldRect.y,
            worldRect.width,
            worldRect.height
        );
    }

    collisionRects.forEach((obstacle) => {
        const screenX = Math.round(worldToScreenX(obstacle.x, worldRect));
        const screenY = Math.round(worldToScreenY(obstacle.y, worldRect));
        const screenWidth = Math.max(1, Math.round(worldToScreenWidth(obstacle.width, worldRect)));
        const screenHeight = Math.max(1, Math.round(worldToScreenHeight(obstacle.height, worldRect)));

        ctx.fillStyle = "rgba(255, 120, 120, 0.16)";
        ctx.strokeStyle = "rgba(255, 160, 80, 0.95)";
        ctx.fillRect(screenX, screenY, screenWidth, screenHeight);
        ctx.strokeRect(screenX + 0.5, screenY + 0.5, Math.max(0, screenWidth - 1), Math.max(0, screenHeight - 1));
    });

    const playerHitbox = getPlayerHitbox();
    const playerScreenX = Math.round(worldToScreenX(playerHitbox.x, worldRect));
    const playerScreenY = Math.round(worldToScreenY(playerHitbox.y, worldRect));
    const playerScreenWidth = Math.max(1, Math.round(worldToScreenWidth(playerHitbox.width, worldRect)));
    const playerScreenHeight = Math.max(1, Math.round(worldToScreenHeight(playerHitbox.height, worldRect)));
    const isCollisionActive = collidesWithCollisionMask(playerHitbox);

    ctx.strokeStyle = "rgba(0, 255, 160, 0.95)";
    ctx.strokeRect(
        playerScreenX + 0.5,
        playerScreenY + 0.5,
        Math.max(0, playerScreenWidth - 1),
        Math.max(0, playerScreenHeight - 1)
    );

    const hasCollisionMap = collisionRects.length > 0;

    ctx.fillStyle = "rgba(8, 12, 18, 0.8)";
    ctx.fillRect(worldRect.x + 12, worldRect.y + 12, 260, 112);
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px monospace";
    ctx.textBaseline = "top";
    ctx.fillText(hasCollisionMap ? "Mode: bgfinal precalculated" : "Mode: no precalc collisions", worldRect.x + 20, worldRect.y + 20);
    ctx.fillText(`Player: ${Math.round(player.x)}, ${Math.round(player.y)}`, worldRect.x + 20, worldRect.y + 34);
    ctx.fillText(hasCollisionMap ? "Source: HsBG/bgfinal.png" : "Source: none", worldRect.x + 20, worldRect.y + 48);
    ctx.fillText(`Map hit: ${isCollisionActive}`, worldRect.x + 20, worldRect.y + 62);
    ctx.fillText(`Map rects: ${collisionRects.length}`, worldRect.x + 20, worldRect.y + 76);
    ctx.fillText(`Mask image: ${collisionMapLoadState}`, worldRect.x + 20, worldRect.y + 90);
    ctx.fillText("Walkable: transparent only", worldRect.x + 20, worldRect.y + 104);

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
