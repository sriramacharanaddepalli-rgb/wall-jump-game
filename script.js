// --- Game State Variables ---
const player = document.getElementById('player');
const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score');

let isGameOver = true;
let score = 0;

// Player physics properties
let playerY = 0; // Vertical position (relative to bottom of container)
let playerVelocity = 0; // Vertical speed
const gravity = 0.6;
const jumpStrength = 15;
const floorY = 0; // Ground level

// Obstacle properties
const obstacleSpeed = 4; // How fast obstacles move left
const obstacleSpawnRate = 1500; // Time in milliseconds between new obstacles (1.5 seconds)
let lastSpawnTime = 0;
const obstacles = [];

// --- Initialization and Events ---

// 1. Initial setup and start screen
function initializeGame() {
    // Set initial player position
    playerY = floorY;
    player.style.bottom = `${playerY}px`;
    
    // Add a simple message overlay
    const startMessage = document.createElement('div');
    startMessage.id = 'start-message';
    startMessage.textContent = 'Press SPACE to Start and Jump!';
    gameContainer.appendChild(startMessage);
}

// 2. Start/Restart game function
function startGame() {
    if (!isGameOver) return; // Prevent starting a game that's already running

    isGameOver = false;
    score = 0;
    playerY = floorY;
    playerVelocity = 0;
    scoreDisplay.textContent = 'Score: 0';
    
    // Remove all existing obstacles
    obstacles.forEach(obs => obs.element.remove());
    obstacles.length = 0;
    
    // Remove start/game over message
    const message = document.getElementById('start-message');
    if (message) message.remove();
    
    // Begin the game loop
    requestAnimationFrame(gameLoop);
}

// 3. Jump handler
function handleJump(event) {
    // Only jump if the game is running OR if it's a new game start
    if (event.code === 'Space') {
        if (isGameOver) {
            startGame();
            return;
        }
        
        // Give the player an upward velocity
        playerVelocity = jumpStrength;
    }
}

// Add event listener for the jump/start key
document.addEventListener('keydown', handleJump);
initializeGame();

// --- Game Loop Functions ---

// 4. Update player position (Gravity and Jump)
function updatePlayer() {
    // Apply gravity to velocity
    playerVelocity -= gravity;
    // Update position based on velocity
    playerY += playerVelocity;

    // Check for floor collision
    if (playerY <= floorY) {
        playerY = floorY;
        playerVelocity = 0;
    }

    // Apply new position to CSS
    player.style.bottom = `${playerY}px`;
}

// 5. Create new obstacles
function createObstacle() {
    const obstacleHeight = 50 + Math.random() * 150; // Random height between 50px and 200px
    const gapHeight = 100; // Fixed gap size for the player to pass through
    const gameHeight = gameContainer.clientHeight;
    
    // Calculate the top part of the pipe
    const pipeTopHeight = gameHeight - obstacleHeight - gapHeight;

    // --- Bottom Obstacle ---
    const obsBottom = document.createElement('div');
    obsBottom.classList.add('obstacle');
    obsBottom.style.height = `${obstacleHeight}px`;
    obsBottom.style.bottom = `0px`; // Positioned at the bottom
    
    gameContainer.appendChild(obsBottom);
    obstacles.push({
        element: obsBottom,
        x: gameContainer.clientWidth, // Start at the right edge
        width: 30, // Matches CSS
        height: obstacleHeight,
        y: 0,
        passed: false // To track if the player passed it for scoring
    });

    // --- Top Obstacle (Mirror) ---
    const obsTop = document.createElement('div');
    obsTop.classList.add('obstacle');
    obsTop.style.height = `${pipeTopHeight}px`;
    obsTop.style.bottom = `${obstacleHeight + gapHeight}px`; // Positioned above the gap
    
    gameContainer.appendChild(obsTop);
    // Note: We only track one set (the bottom one) for scoring and collision complexity
}

// 6. Move obstacles and check score
function updateObstacles(deltaTime) {
    const now = Date.now();
    
    // Spawn new obstacles based on spawn rate
    if (now - lastSpawnTime > obstacleSpawnRate) {
        createObstacle();
        lastSpawnTime = now;
    }
    
    // Loop through existing obstacles (Note: uses a temporary array for safety)
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        
        // Move obstacle left
        obs.x -= obstacleSpeed; 
        obs.element.style.right = `${gameContainer.clientWidth - obs.x}px`;

        // Check for scoring (player passes the obstacle's x-coordinate)
        if (obs.x < 50 && !obs.passed) { // 50px is the player's fixed left position
            score++;
            obs.passed = true;
            scoreDisplay.textContent = `Score: ${score}`;
        }
        
        // Remove obstacle if it goes off-screen
        if (obs.x < -obs.width) {
            obs.element.remove();
            obstacles.splice(i, 1);
        }
    }
    
    // Since we only track the bottom pipe in the array, 
    // we need to update the positions of all elements with the class 'obstacle'
    const allObstacles = document.querySelectorAll('.obstacle');
    allObstacles.forEach(obsEl => {
        let currentRight = parseFloat(obsEl.style.right || 0);
        obsEl.style.right = `${currentRight + obstacleSpeed}px`;
    });
}

// 7. Collision Detection (AABB)
function checkCollisions() {
    const playerBounds = player.getBoundingClientRect();
    const containerBounds = gameContainer.getBoundingClientRect();
    
    // Convert player bounds to be relative to the game container
    const p = {
        left: playerBounds.left - containerBounds.left,
        right: playerBounds.right - containerBounds.left,
        bottom: playerBounds.bottom - containerBounds.top,
        top: playerBounds.top - containerBounds.top,
        width: playerBounds.width,
        height: playerBounds.height,
        // Y position from bottom
        yFromBottom: containerBounds.height - playerBounds.bottom + containerBounds.top
    };

    const allObstacles = document.querySelectorAll('.obstacle');
    
    allObstacles.forEach(obsEl => {
        const obsBounds = obsEl.getBoundingClientRect();
        
        // Convert obstacle bounds to be relative to the game container
        const o = {
            left: obsBounds.left - containerBounds.left,
            right: obsBounds.right - containerBounds.left,
            bottom: obsBounds.bottom - containerBounds.top,
            top: obsBounds.top - containerBounds.top,
        };

        // Simplified Axis-Aligned Bounding Box (AABB) check
        // Check for overlap on the X-axis (horizontal collision)
        const xOverlap = p.right > o.left && p.left < o.right;
        
        // Check for overlap on the Y-axis (vertical collision)
        const yOverlap = p.top < o.bottom && p.bottom > o.top; // Check if player is between top and bottom of the pipe
        
        if (xOverlap && yOverlap) {
            endGame();
        }
    });
}

// 8. End Game Function
function endGame() {
    if (isGameOver) return;
    isGameOver = true;
    
    const gameOverMessage = document.createElement('div');
    gameOverMessage.id = 'start-message'; // Reusing the ID for styling
    gameOverMessage.textContent = `Game Over! Score: ${score}. Press SPACE to restart.`;
    gameContainer.appendChild(gameOverMessage);
}


// 9. Main Game Loop
let lastTime = 0;
function gameLoop(time) {
    if (isGameOver) return; // Stop the loop if the game is over

    // Simple time tracking, though not strictly needed for this basic loop
    const deltaTime = time - lastTime;
    lastTime = time;

    updatePlayer();
    updateObstacles(deltaTime);
    checkCollisions();

    // Loop continuously
    requestAnimationFrame(gameLoop);
}