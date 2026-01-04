const canvas = document.getElementById("game_canvas");
const ctx = canvas.getContext("2d");

// zdjecia
const img_background = new Image();
img_background.src = "tło3.jpg";

const img_ready = new Image();
img_ready.src = "bunny1_ready.png";

const img_jump = new Image();
img_jump.src = "bunny1_jump.png";

const img_platform = new Image();
img_platform.src = "platform.png";

const img_platform_start = new Image();
img_platform_start.src = "platform_start.png";

// klaiwsze i nasluchiwacze
const keys = { left: false, right: false, up: false };

window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowLeft") keys.left = true;
    if (e.code === "ArrowRight") keys.right = true;
    if (e.code === "ArrowUp") keys.up = true;
});

window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft") keys.left = false;
    if (e.code === "ArrowRight") keys.right = false;
    if (e.code === "ArrowUp") keys.up = false;
});

// ustawienia postaci ,platform
const bunnyWidth = 120;
const bunnyHeight = 191;

const WORLD_W = 1200;

const MIN_GAP = 90;
const MAX_GAP = 160;
const PLATFORM_MIN_W = 160;
const PLATFORM_MAX_W = 280;

const START_PLATFORM_RISE = 100;
const START_PLATFORM_W = 360;
const START_PLATFORM_H = 70;
const START_PLATFORM_COUNT = 9;

const cameraLine = 220;

// zmienne wynikowe
const SCORE_SCALE = 100;
let totalScroll = 0;
let score = 0;
let lastScore = 0;
let bestScore = Number(localStorage.getItem("bestScore") || 0);

// stan gry
let gameState = "menu";

// przycisk menu
const playBtn = { x: 0, y: 0, w: 260, h: 70 };

// helpery
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//rysowanie obwodu w ramkach
function strokeFillText(text, x, y) {
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
}

//  respawn platform
function spawnPlatform(p, y) {
    const w = randInt(PLATFORM_MIN_W, PLATFORM_MAX_W);
    p.w = w;
    p.h = 30;
    p.x = randInt(0, WORLD_W - w);
    p.y = y;
}


// świat

const platforms = [];

const startPlatform = {
    w: START_PLATFORM_W,
    h: START_PLATFORM_H,
    x: (WORLD_W - START_PLATFORM_W) / 2,
    y: 0, // ustawiane w resetWorld
};

const player = { x: 0, y: 0, speed: 11 };

// RESET

function resetWorld() {
    totalScroll = 0;
    score = 0;

    platforms.length = 0;

    startPlatform.x = (WORLD_W - startPlatform.w) / 2;
    startPlatform.y = canvas.height - 20 - START_PLATFORM_RISE;
    platforms.push(startPlatform);

    let y = startPlatform.y - randInt(MIN_GAP, MAX_GAP);
    for (let i = 0; i < START_PLATFORM_COUNT; i++) {
        const p = { x: 0, y: 0, w: 0, h: 20 };
        spawnPlatform(p, y);
        platforms.push(p);
        y -= randInt(MIN_GAP, MAX_GAP);
    }

    player.x = startPlatform.x + (startPlatform.w - bunnyWidth) / 2;
    player.y = startPlatform.y - bunnyHeight;

    keys.left = keys.right = keys.up = false;
    bunny.velocity = 0;
    bunny.onGround = false;
}

// KONIEC GRY

function endGame() {
    lastScore = score;
    if (lastScore > bestScore) {
        bestScore = lastScore;
        localStorage.setItem("bestScore", String(bestScore));
    }
    gameState = "menu";
    keys.left = keys.right = keys.up = false;
}


// klasa bunny

class Bunny {
    constructor({ img }) {
        this.img = img;
        this.velocity = 0;
        this.weight = 1.75;
        this.onGround = false;
    }
    // metoda draw
    draw() {
        const prevY = player.y;

        if (keys.left) player.x -= player.speed;
        if (keys.right) player.x += player.speed;

        if (keys.up && this.onGround) {
            this.velocity = -45;
            this.onGround = false;
        }

        player.y += this.velocity;
        this.velocity += this.weight;

        this.onGround = false;

        for (const p of platforms) {
            const falling = this.velocity >= 0;

            const bunnyLeft = player.x;
            const bunnyRight = player.x + bunnyWidth;
            const bunnyBottom = player.y + bunnyHeight;
            const prevBottom = prevY + bunnyHeight;

            const crossesTop = prevBottom <= p.y && bunnyBottom >= p.y;
            const overlapX = bunnyRight > p.x && bunnyLeft < p.x + p.w;

            if (falling && crossesTop && overlapX) {
                player.y = p.y - bunnyHeight;
                this.velocity = 0;
                this.onGround = true;
                break;
            }
        }

        // spadanie na dol
        if (!this.onGround && player.y >= canvas.height - bunnyHeight) {
            endGame();
            return;
        }

        // kamera z wynik
        if (player.y < cameraLine) {
            const dy = cameraLine - player.y;
            player.y = cameraLine;

            for (const p of platforms) p.y += dy;

            totalScroll += dy;
            score = Math.floor(totalScroll / SCORE_SCALE);
        }

        this.img = this.onGround ? img_ready : img_jump;

        if (player.x < 0) player.x = 0;
        if (player.x + bunnyWidth > WORLD_W) player.x = WORLD_W - bunnyWidth;

        ctx.drawImage(this.img, player.x, player.y);
    }
}

const bunny = new Bunny({ img: img_ready });

// score i menu
function drawHUD() {
    ctx.font = "24px Arial";
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;

    strokeFillText(`Score: ${score}`, 60, 40);
    strokeFillText(`Best: ${bestScore}`, 70, 70);
}

function drawMenu() {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";

    ctx.font = "64px Arial";
    ctx.lineWidth = 6;
    strokeFillText("BUNNY JUMP", canvas.width / 2, canvas.height * 0.28);

    ctx.font = "28px Arial";
    ctx.lineWidth = 4;
    strokeFillText(`Najlepszy: ${bestScore}`, canvas.width / 2, canvas.height * 0.40);
    strokeFillText(`Ostatni: ${lastScore}`, canvas.width / 2, canvas.height * 0.46);

    playBtn.x = canvas.width / 2 - playBtn.w / 2;
    playBtn.y = canvas.height * 0.60;

    ctx.fillStyle = "white";
    ctx.fillRect(playBtn.x, playBtn.y, playBtn.w, playBtn.h);
    ctx.strokeRect(playBtn.x, playBtn.y, playBtn.w, playBtn.h);

    ctx.fillStyle = "black";
    ctx.font = "36px Arial";
    ctx.fillText("GRAJ", canvas.width / 2, playBtn.y + 48);
}

// klik w menu
canvas.addEventListener("click", (e) => {
    if (gameState !== "menu") return;

    const r = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (canvas.width / r.width);
    const my = (e.clientY - r.top) * (canvas.height / r.height);

    if (
        mx >= playBtn.x &&
        mx <= playBtn.x + playBtn.w &&
        my >= playBtn.y &&
        my <= playBtn.y + playBtn.h
    ) {
        resetWorld();
        gameState = "playing";
    }
});



// funcja animate (petla gry )
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img_background, 0, 0);

    if (gameState === "playing") {
        let topY = Infinity;
        for (const p of platforms) if (p.y < topY) topY = p.y;

        for (const p of platforms) {
            if (p === startPlatform) continue;

            if (p.y > canvas.height + 50) {
                const gap = randInt(MIN_GAP, MAX_GAP);
                spawnPlatform(p, topY - gap);
                topY = p.y;
            }
        }
    }

    for (const p of platforms) {
        if (p === startPlatform) {
            ctx.drawImage(img_platform_start, p.x, p.y, p.w, p.h);
        } else {
            ctx.drawImage(img_platform, p.x, p.y, p.w, p.h);
        }
    }

    if (gameState === "playing") {
        bunny.draw();
        drawHUD();
    } else {
        drawMenu();
    }

    requestAnimationFrame(animate);
}

// start
resetWorld();
gameState = "menu";
animate();
