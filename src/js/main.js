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
        // Apply Gravity
        if (charY > groundLevel) {
            velocityY -= gravity;
        }

        // --- Platform Collision (Pipe) ---
        const pipe = document.getElementById('pipe');
        let onPlatform = false;

        if (pipe) {
            const charRect = character.getBoundingClientRect();
            const pipeRect = pipe.getBoundingClientRect();
            
            // 1. Horizontal Check
            if (charRect.right > pipeRect.left + 15 && charRect.left < pipeRect.right - 15) {
                
                // 2. Vertical Check (Falling onto pipe)
                // Calculate Pipe Top in % relative to screen height
                // pipeRect.top is distance from top of screen.
                // Screen Height = window.innerHeight
                // Pipe Top from Bottom (px) = window.innerHeight - pipeRect.top
                // Pipe Top from Bottom (%) = (window.innerHeight - pipeRect.top) / window.innerHeight * 100
                
                const pipeTopFromBottomPx = window.innerHeight - pipeRect.top;
                const pipeTopPct = (pipeTopFromBottomPx / window.innerHeight) * 100;
                
                // Compare charY (feet position %) with pipeTopPct
                // Tolerance: if near top and falling
                if (Math.abs(charY - pipeTopPct) < 5 && velocityY <= 0) {
                    onPlatform = true;
                    charY = pipeTopPct; // Snap to top
                    velocityY = 0;
                    isJumping = false;
                }
            }
        }

        // Apply Velocity if not stuck on platform
        // But if we snapped, we already set charY.
        // If we are NOT on platform, we apply velocity.
        if (!onPlatform) {
             charY += velocityY;
        }

        // Ground Collision (Floor)
        if (charY <= groundLevel) {
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

        // Check Collisions
        if (typeof checkInteractions === 'function') {
            checkInteractions();
        }

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

        if (Math.abs(diffX) > 30) { // Increased threshold slightly
            if (diffX > 0) keys.ArrowRight = true;
            else keys.ArrowLeft = true;
        } else {
            keys.ArrowRight = false;
            keys.ArrowLeft = false;
        }

        // Swipe Up (Jump)
        if (diffY < -50 && !isJumping) { 
             keys.ArrowUp = true;
             // Auto-release jump key after short delay to prevent infinite jump logic if held
             setTimeout(() => keys.ArrowUp = false, 300);
        }

        // Swipe Down (Crouch / Enter Pipe)
        if (diffY > 50) {
            keys.ArrowDown = true;
            // Keep it pressed for a bit to ensure pipe logic catches it
            setTimeout(() => keys.ArrowDown = false, 500);
        }
    }, {passive: false});

    heroSection.addEventListener('touchend', (e) => {
        // Reset all keys on touch end to be safe
        keys.ArrowLeft = false;
        keys.ArrowRight = false;
        // keys.ArrowUp = false; // Handled by timeout
        // keys.ArrowDown = false; // Handled by timeout
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

    // --- Game Elements Logic ---
    const mysteryBlock = document.getElementById('mystery-block');
    const star = document.getElementById('star');
    const pipe = document.getElementById('pipe');
    const portal = document.getElementById('portal');

    // Enhanced Collision Detection
    // Returns collision data or null
    function checkCollision(char, el) {
        let r1 = char.getBoundingClientRect();
        const r2 = el.getBoundingClientRect();
        
        // Define Hitboxes
        // Body (General): Smaller than visual size
        const shrinkX = r1.width * 0.4; 
        const shrinkY = r1.height * 0.2;
        
        const bodyBox = {
            left: r1.left + shrinkX / 2,
            right: r1.right - shrinkX / 2,
            top: r1.top + shrinkY, 
            bottom: r1.bottom, // Feet are bottom
            width: r1.width - shrinkX,
            height: r1.height - shrinkY,
            centerX: r1.left + r1.width / 2,
            centerY: r1.top + r1.height / 2
        };

        // Check overlap with Body Box
        const overlap = !(bodyBox.right < r2.left || 
                         bodyBox.left > r2.right || 
                         bodyBox.bottom < r2.top || 
                         bodyBox.top > r2.bottom);
        
        if (!overlap) return null;

        // Determine precise side based on centers and penetration
        const dx = bodyBox.centerX - (r2.left + r2.width / 2);
        const dy = bodyBox.centerY - (r2.top + r2.height / 2);
        
        // Combined half-widths/heights
        const combinedHalfWidth = (bodyBox.width + r2.width) / 2;
        const combinedHalfHeight = (bodyBox.height + r2.height) / 2;

        // Calculate penetration depth
        const overlapX = combinedHalfWidth - Math.abs(dx);
        const overlapY = combinedHalfHeight - Math.abs(dy);

        if (overlapX > overlapY) {
            // Collision is vertical
            if (dy > 0) return 'top'; // Character is below element (Hitting head?) -> Wait, if dy > 0, char center > el center. Char is BELOW. So char top hits el bottom.
            // Actually:
            // if (bodyBox.centerY > r2.centerY) -> Char is lower (y is higher). So Head hits Bottom.
            // Let's stick to standard return values:
            // 'bottom': Character is hitting the bottom of the element (Head bonk)
            // 'top': Character is landing on top of the element (Feet land)
            
            if (dy > 0) return 'bottom'; // Char is below, so hitting from bottom
            return 'top'; // Char is above, so landing on top
        } else {
            // Collision is horizontal
            return 'side';
        }
    }

    function checkInteractions() {
        if (!gameStarted) return;

        // --- Mystery Block Logic (HEAD BONK) ---
        if (mysteryBlock) {
            const col = checkCollision(character, mysteryBlock);
            if (col) {
                // 'bottom' means Character is BELOW element (so Head hits Bottom)
                // velocityY > 0 means moving UP
                if (col === 'bottom' && velocityY > 0 && !mysteryBlock.classList.contains('empty')) {
                     mysteryBlock.classList.add('empty');
                     mysteryBlock.classList.add('bounce');
                     setTimeout(() => mysteryBlock.classList.remove('bounce'), 200);

                     // Reveal Star
                     if (star) {
                         star.classList.remove('hidden');
                         star.classList.add('popped');
                     }
                     
                     // Bonk physics: Stop upward movement and bounce back down slightly
                     velocityY = -2; 
                } 
            }
        }

        // --- Star Collection (BODY) ---
        if (star && star.classList.contains('popped') && !star.classList.contains('collected')) {
            if (checkCollision(character, star)) {
                star.classList.add('collected');
                console.log("Star Collected! Growing!");
                character.classList.add('giant');
                // Optional sound here
            }
        }

        // --- Portal (BODY) ---
        if (portal && checkCollision(character, portal)) {
            if (!character.dataset.teleporting) {
                character.dataset.teleporting = "true";
                portal.style.transform = "scale(1.2)";
                
                character.style.transition = "transform 0.5s, opacity 0.5s";
                character.style.transform += " scale(0) rotate(360deg)";
                character.style.opacity = "0";

                setTimeout(() => {
                     window.location.href = "about.html";
                }, 800); 
            }
        }

        // --- Pipe Entry (FEET) ---
        // Requirement: Standing on top (handled by Physics loop mostly) + Pressing Down.
        if (pipe) {
            // We can also check collision 'top' (Char is ABOVE pipe)
            const col = checkCollision(character, pipe);
            
            // Check center alignment specifically for entry
            if (col === 'top' || (Math.abs((character.getBoundingClientRect().left + character.getBoundingClientRect().width/2) - (pipe.getBoundingClientRect().left + pipe.getBoundingClientRect().width/2)) < 30)) {
                if (keys.ArrowDown && !character.dataset.piping) {
                    // Must be effective grounded
                    if (Math.abs(velocityY) < 1) { 
                        character.dataset.piping = "true";
                        console.log("Entering Pipe...");
                        
                        // 1. Center Character on Pipe (Visual Snap)
                        const pipeCenter = pipe.offsetLeft + pipe.offsetWidth / 2;
                        const screenW = heroSection.offsetWidth;
                        const centerPct = (pipeCenter / screenW) * 100;
                        
                        // Smoothly snap x
                        charX = centerPct; 
                        character.style.left = `${charX}%`;
                        
                        // 2. Animation: "Sucked In"
                        // Go behind pipe immediately?
                        character.style.zIndex = 3; // Pipe is 10
                        
                        // Slide down and Squish slightly
                        character.style.transition = "bottom 1.5s ease-in, transform 1.5s ease-in";
                        character.style.bottom = "-20%"; 
                        // Add squish effect to transform
                        character.style.transform += " scaleX(0.8) scaleY(1.2)"; 
                        
                        const transitionOverlay = document.getElementById('pipe-transition');
                        
                        setTimeout(() => {
                            // 3. Trigger Screen Wipe
                            if (transitionOverlay) transitionOverlay.classList.add('active');
                            
                            setTimeout(() => {
                                // 4. Scroll
                                const mapSection = document.getElementById('explore');
                                mapSection.scrollIntoView({ behavior: 'auto' }); 
                                
                                // 5. Reset Character
                                character.style.transition = ""; 
                                charY = groundLevel; 
                                character.style.bottom = `${charY}%`;
                                character.style.zIndex = ""; 
                                delete character.dataset.piping;
                                // Reset Transform (remove squish)
                                character.style.transform = character.style.transform.replace(" scaleX(0.8) scaleY(1.2)", "");

                                setTimeout(() => {
                                    transitionOverlay.classList.remove('active');
                                }, 500);

                            }, 800); 
                        }, 1000); // Wait longer for the full "slide down" effect
                    }
                    }
                }
            }
        }
    }

    // Initial Call
    gameLoop();
});