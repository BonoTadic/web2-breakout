// Dohvati canvas i context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Globalne varijable za igru
let paddleWidth = 150;
let paddleHeight = 20;
let ballRadius = 10;
let ballSpeed = 4;
// Nasumični smjer loptice
let ballDirectionX = Math.random() * 2 - 1;
let ballDirectionY = -1;
// Pozicija palice (X-os)
let paddleX = 0;
let paddleOffsetY = 30;
let paddleDX = 0;
let paddleSpeed = 7;
let score = 0;
let maxScore = localStorage.getItem('maxScore') || 0;
let gameOver = false;
// Poruka za igraca (u slucaju pobjede ili poraza)
let gameMessage = "";
let gameMessageColor = "";

// Broj cigli
const brickRows = 3;
const brickCols = 5;
// Razmak izmedu cigli
const brickPadding = 10;
const brickHeight = 20;
// Pomakni cigle prema dolje tako da ne budu ispod teksta za bodove
const brickOffsetY = 80;

// Sirina cigle
let brickWidth = 0;

let bricks = [];

function handleKeyDown(event) {
    // Pomicanje palice prema lijevo
    if (event.key === "ArrowLeft") {
        paddleDX = -paddleSpeed;
    } else if (event.key === "ArrowRight") {
    // Pomicanje palice prema desno
        paddleDX = paddleSpeed;
    }

    // Ponovno pokretanje igre pritiskom na tipku Enter
    if (gameOver && event.key === "Enter") {
        restartGame();
    }
}

function handleKeyUp(event) {
    // Zaustavi palicu otpustanjem tipki
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        paddleDX = 0;
    }
}

// Funkcija za racunanje velicine canvasa s obzirom na velicinu prozora
function resizeCanvas() {
    // Postavi dimenzije canvasa na dimenzije prozora
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Racunanje sirine cigle s obzirom na sirinu canvasa
    const totalBrickWidth = canvas.width - (brickCols + 1) * brickPadding;
    brickWidth = totalBrickWidth / brickCols;

    // Osiguraj da sirina cigle bude barem 50px
    if (brickWidth < 50) {
        brickCols = Math.floor((canvas.width - brickPadding) / 50);
        brickWidth = (canvas.width - (brickCols + 1) * brickPadding) / brickCols;
    }

    // Racunanje pocetne pozicije loptice
    ballX = canvas.width / 2;
    ballY = canvas.height - paddleHeight - paddleOffsetY - ballRadius;

    // Racunanje pocetne pozicije palice
    paddleX = (canvas.width - paddleWidth) / 2;

    // Stvori raspored cigli s obzirom na azurirane dimenzije canvasa
    createBricks();
}

// Funkcija za dodavanje cigli u matricu bricks
function createBricks() {
    bricks = [];
    for (let row = 0; row < brickRows; row++) {
        bricks[row] = [];
        for (let col = 0; col < brickCols; col++) {
            bricks[row][col] = {
                // X koordinata cigle
                x: col * (brickWidth + brickPadding) + brickPadding,
                // Y koordinata cigle
                y: row * (brickHeight + brickPadding) + brickOffsetY,
                // Sirina cigle
                width: brickWidth,
                // Visina cigle
                height: brickHeight,
                // Zastavica koja predstavlja je li cigla razbijena
                destroyed: false
            };
        }
    }
}

// Funkcija za azuriranje pozicije loptice
function updateBall() {
    // X komponenta brzine
    ballX += ballDirectionX * ballSpeed;
    // Y komponenta brzine
    ballY += ballDirectionY * ballSpeed;

    // Promijeni smjer loptice ukoliko je doslo do kolizije sa zidom
    // Desni zid
    if (ballX + ballRadius > canvas.width || ballX - ballRadius < 0) ballDirectionX = -ballDirectionX;
    // Lijevi zid
    if (ballY - ballRadius < 0) ballDirectionY = -ballDirectionY;

    // Promijeni smjer loptice ukoliko je doslo do kolizije s palicom
    let paddleY = canvas.height - paddleHeight - paddleOffsetY;
    // Prepoznta kolizija s palicom
    if (ballY + ballRadius > paddleY && ballY + ballRadius < paddleY + paddleHeight && ballX > paddleX &&
        ballX < paddleX + paddleWidth && ballDirectionY > 0) {
        // Obrni smjer u osi Y
        ballDirectionY = -ballDirectionY;

        // Relativna pozicija loptice prilikom kolizije (u odnosu na sredinu palice, interval [-1, 1])
        let hitPos = (ballX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);

        // Skaliranje hitPos kako bi se postigao jaci horizontalni otklon sto je kolizija blize
        // rubovima palice (spin efekt)
        ballDirectionX = hitPos * 2;
        // Ogranicenje otklona loptice da loptica ne bi bila prebrza/prespora nakon odbijanja
        ballDirectionX = Math.min(Math.max(ballDirectionX, -1), 1);
    }

    // Prekini igru ukoliko je loptica izasla iz canvasa
    if (ballY + ballRadius > canvas.height) {
        gameOver = true;
        gameMessage = "GAME OVER - Press Enter to restart";
        gameMessageColor = "red";
        showGameOver();
    }

    // Zastavica za kraj igre (u slucaju pobjede)
    let allBricksDestroyed = true;

    // Promijeni smjer loptice ukoliko je doslo do kolizije s ciglom
    for (let row = 0; row < brickRows; row++) {
        for (let col = 0; col < brickCols; col++) {
            let brick = bricks[row][col];
            if (!brick.destroyed) {
                allBricksDestroyed = false;
                // Prepoznata kolizija loptice s ciglom
                if (ballX + ballRadius > brick.x &&
                    ballX - ballRadius < brick.x + brick.width &&
                    ballY + ballRadius > brick.y &&
                    ballY - ballRadius < brick.y + brick.height) {

                    // Cigla je pogodena, ukloni je s ekrana pri sljedecm pozivu funkcije draw()
                    brick.destroyed = true;
                    // Promijeni smjer loptice nakon kolizije
                    if (ballX < brick.x || ballX > brick.x + brick.width) {
                        ballDirectionX = -ballDirectionX;
                    } else {
                        ballDirectionY = -ballDirectionY;
                    }
                    score++;
                    if (score > maxScore) {
                        maxScore = score;
                        localStorage.setItem('maxScore', maxScore);
                    }
                }
            }
        }
    }

    if (allBricksDestroyed) {
        gameOver = true;
        gameMessage = "YOU WIN - Press Enter to restart";
        gameMessageColor = "green";
        showGameOver();
    }
}

// Funkcija za azuriranje pozicije palice
function updatePaddle() {
    paddleX += paddleDX;
    // Ogranici poziciju palice tako da ostane unutar canvasa
    if (paddleX < 0) paddleX = 0;
    if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
}

// Funkcija za crtanje svih elemenata igre
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Loptica
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();

    // Palica
    let paddleY = canvas.height - paddleHeight - paddleOffsetY;
    // Gradijent za sjencanje
    let gradient = ctx.createLinearGradient(paddleX, paddleY, paddleX + paddleWidth, paddleY + paddleHeight);
    gradient.addColorStop(0, '#ff4d4d');
    gradient.addColorStop(1, '#b30000');
    ctx.beginPath();
    ctx.rect(paddleX, paddleY, paddleWidth, paddleHeight);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();

    // Cigle
    for (let row = 0; row < brickRows; row++) {
        for (let col = 0; col < brickCols; col++) {
            let brick = bricks[row][col];
            if (!brick.destroyed) {
                // Gradijent za sjencanje
                let brickGradient = ctx.createLinearGradient(brick.x, brick.y, brick.x + brick.width, brick.y + brick.height);
                brickGradient.addColorStop(0, '#66cc66');
                brickGradient.addColorStop(1, '#339933');
                ctx.beginPath();
                ctx.rect(brick.x, brick.y, brick.width, brick.height);
                ctx.fillStyle = brickGradient;
                ctx.fill();
                ctx.closePath();
            }
        }
    }

    // Prikaz trenutnog broja bodova i najboljeg rezultata
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`Score: ${score}`, canvas.width - 150, 30);
    ctx.fillText(`Max Score: ${maxScore}`, canvas.width - 150, 60);

    if (gameOver) {
        showGameOver();
    }
}

// Funkcija za prikazivanje poruke o kraju igre (poraz ili pobjeda)
function showGameOver() {
    ctx.font = '50px Arial';
    ctx.fillStyle = gameMessageColor;
    const textWidth = ctx.measureText(gameMessage).width;
    const textHeight = 50;
    ctx.fillText(gameMessage, (canvas.width - textWidth) / 2, (canvas.height - textHeight) / 2);
}

// Funkcija za ponovno pokretanje igre
function restartGame() {
    gameOver = false;
    score = 0;
    ballDirectionX = Math.random() * 2 - 1;
    ballDirectionY = -1;
    ballX = canvas.width / 2;
    ballY = canvas.height - paddleHeight - ballRadius;
    paddleX = (canvas.width - paddleWidth) / 2;

    createBricks();
}

// Glavna funkcija za izvodenje igre
function gameLoop() {
    if (!gameOver) {
        updateBall();
        updatePaddle();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

// Dodavanje listenera za pritisak tipki
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
window.addEventListener("resize", resizeCanvas);

// Inicijalizacija igre
resizeCanvas();
gameLoop();
