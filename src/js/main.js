document.addEventListener('DOMContentLoaded', () => {
    // --- Start Screen Logic ---
    const startScreen = document.getElementById('start-screen');
    const audio = document.getElementById('bgMusic');
    const playButton = document.getElementById('music-control');
    let gameStarted = false;

    // Explicitly set volume
    audio.volume = 1.0;

    const startGame = () => {
        if (gameStarted) return;
        gameStarted = true;

        // Hide overlay
        startScreen.classList.add('hidden');

        // Play Audio
        audio.play().then(() => {
            playButton.textContent = 'MUSIC: ON';
        }).catch(err => {
            console.log("Audio play failed:", err);
            playButton.textContent = 'MUSIC: OFF'; // Should not happen with direct interaction
        });
    };

    startScreen.addEventListener('click', startGame);

    // --- Navigation & UI ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.navbar ul');
    
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
        });

        document.querySelectorAll('.navbar ul li a').forEach(link => {
            link.addEventListener('click', (e) => {
                // If it's the specific HOME link
                if (link.getAttribute('href') === '#hero') {
                    e.preventDefault();
                    document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
                }

                if (window.innerWidth <= 768) {
                    navList.classList.remove('active');
                }
            });
        });
    }

    // --- Audio Toggle (Post-Start) ---
    playButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audio.paused) {
            audio.play();
            playButton.textContent = 'MUSIC: ON';
        } else {
            audio.pause();
            playButton.textContent = 'MUSIC: OFF';
        }
    });

    // --- Game / Character Logic ---
    const character = document.getElementById('character');
    const heroSection = document.querySelector('.hero-section');
    
    // Config
    // Char Height is 256px (approx 25-30% of screen depending on resolution, but let's treat it as percentage for logic)
    // Goal: Jump Height = 1.5 * Char Height
    // If Char Height is visually ~20% of container, Jump Height should be ~30% above ground.
    // Total Jump Height from ground = 30%.
    // Physics: h = v^2 / (2g) => v = sqrt(2gh)
    
    const gravity = 1.2; // Slightly stronger gravity for snappier feel
    const groundLevel = 20; // Matches CSS bottom: 20%
    // Tuned manually: 22 was too high. Resetting to 18 for approx 1.5x char height (visually)
    // User requested even lower to stay on screen. Reducing to 15.
    const jumpForce = 15; 
    const speed = 1.0; 

    // State
    let charX = 50; 
    let charY = 20; 
    let velocityY = 0;
    let isJumping = false;
    let facingRight = true;

    // Keys State
    const keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    };

    // Keyboard Visuals
    const updateKeyVisual = (code, active) => {
        let id = '';
        if (code === 'ArrowUp') id = 'key-up';
        if (code === 'ArrowDown') id = 'key-down';
        if (code === 'ArrowLeft') id = 'key-left';
        if (code === 'ArrowRight') id = 'key-right';
        
        const el = document.getElementById(id);
        if (el) {
            if (active) el.classList.add('active');
            else el.classList.remove('active');
        }
    };

    // Keyboard Listeners
    window.addEventListener('keydown', (e) => {
        // Prevent scrolling for Arrow keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }

        if (keys.hasOwnProperty(e.code)) {
            keys[e.code] = true;
            updateKeyVisual(e.code, true);
        }
    });

    window.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.code)) {
            keys[e.code] = false;
            updateKeyVisual(e.code, false);
        }
    });

    // Touch / UI Controls
    const setupTouchControl = (selector, keyCode) => {
        const btn = document.querySelector(selector);
        if (!btn) return;
        
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[keyCode] = true; });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[keyCode] = false; });
        btn.addEventListener('mousedown', (e) => { keys[keyCode] = true; });
        btn.addEventListener('mouseup', (e) => { keys[keyCode] = false; });
        btn.addEventListener('mouseleave', (e) => { keys[keyCode] = false; });
    };

    setupTouchControl('.d-pad .up', 'ArrowUp');
    setupTouchControl('.d-pad .down', 'ArrowDown');
    setupTouchControl('.d-pad .left', 'ArrowLeft');
    setupTouchControl('.d-pad .right', 'ArrowRight');
    setupTouchControl('.action-buttons .btn-a', 'ArrowUp'); 
    setupTouchControl('.action-buttons .btn-b', 'ArrowDown'); 

    // Game Loop
    function gameLoop() {
        if (!gameStarted) {
            requestAnimationFrame(gameLoop);
            return;
        }

        // Horizontal Movement
        if (keys.ArrowLeft) {
            charX -= speed / 2;
            facingRight = false;
        }
        if (keys.ArrowRight) {
            charX += speed / 2;
            facingRight = true;
        }

        // Boundaries
        if (charX < 0) charX = 0;
        if (charX > 100) charX = 100;

        // Jump
        if (keys.ArrowUp && !isJumping) {
            velocityY = jumpForce;
            isJumping = true;
        }

        // Physics
        charY += velocityY;
        
        if (charY > groundLevel) {
            velocityY -= gravity; 
        } else {
            charY = groundLevel;
            velocityY = 0;
            isJumping = false;
        }

        // Apply Styles
        let transform = `translateX(-50%)`;
        if (!facingRight) transform += ` scaleX(-1)`;
        if (keys.ArrowDown) transform += ` scaleY(0.7) translateY(30%)`; 

        character.style.transform = transform;
        character.style.left = `${charX}%`;
        character.style.bottom = `${charY}%`;

        requestAnimationFrame(gameLoop);
    }

    // Swipe Logic
    let touchStartX = 0;
    let touchStartY = 0;
    
    heroSection.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, {passive: false});

    heroSection.addEventListener('touchmove', (e) => {
        if (!gameStarted) return;
        e.preventDefault(); 
        const touchX = e.changedTouches[0].screenX;
        const touchY = e.changedTouches[0].screenY;
        
        const diffX = touchX - touchStartX;
        const diffY = touchY - touchStartY;

        if (Math.abs(diffX) > 20) {
            if (diffX > 0) keys.ArrowRight = true;
            else keys.ArrowLeft = true;
        } else {
            keys.ArrowRight = false;
            keys.ArrowLeft = false;
        }

        if (diffY < -50 && !isJumping) { 
             keys.ArrowUp = true;
             setTimeout(() => keys.ArrowUp = false, 200);
        }
    }, {passive: false});

    heroSection.addEventListener('touchend', (e) => {
        keys.ArrowLeft = false;
        keys.ArrowRight = false;
        keys.ArrowUp = false;
    });

    // --- Map Switching Logic ---
    const mapNodes = document.querySelectorAll('.map-node');
    
    mapNodes.forEach(node => {
        node.addEventListener('click', () => {
            if (node.classList.contains('lock') || node.classList.contains('active')) return;

            // Update Active State
            mapNodes.forEach(n => n.classList.remove('active'));
            node.classList.add('active');

            // Update Background
            const mapName = node.textContent.trim();
            heroSection.classList.remove('bg-forest', 'bg-city'); // Reset to default (Home)

            if (mapName === 'FOREST') {
                heroSection.classList.add('bg-forest');
            } else if (mapName === 'CITY') {
                heroSection.classList.add('bg-city');
            }
            
            // Scroll back to Hero Section
            heroSection.scrollIntoView({ behavior: 'smooth' });
        });
    });

    gameLoop();
});