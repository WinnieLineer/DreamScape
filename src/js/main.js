document.addEventListener('DOMContentLoaded', () => {
    // --- Sound Effects (Synthesized - Crisp) ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    function playGameSound(type) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        const now = audioCtx.currentTime;
        
        if (type === 'bump') {
            // Crisp Bump
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, now);
            oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.1);
            gainNode.gain.setValueAtTime(0.15, now); // Louder
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.start(now);
            oscillator.stop(now + 0.1);
        } else if (type === 'coin') { 
            // Crisp Coin (Ding!)
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1200, now);
            oscillator.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
            gainNode.gain.setValueAtTime(0.2, now); // Louder
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
        } else if (type === 'powerup') { 
            // Power Up (Rising)
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(300, now);
            oscillator.frequency.linearRampToValueAtTime(1000, now + 0.6);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
            oscillator.start(now);
            oscillator.stop(now + 0.6);
        } else if (type === 'warp') { 
            // Warp (Sliding down)
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.linearRampToValueAtTime(50, now + 0.5);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
            oscillator.start(now);
            oscillator.stop(now + 0.5);
        }
    }

    // --- Start Screen Logic ---
    const startScreen = document.getElementById('start-screen');
    const audio = document.getElementById('bgMusic');
    const playButton = document.getElementById('music-control');
    let gameStarted = false;

    // Explicitly set volume if audio exists
    if (audio) {
        audio.volume = 1.0;
    }

    const startGame = () => {
        if (gameStarted) return;
        gameStarted = true;
        
        // Save state
        sessionStorage.setItem('gameStarted', 'true');

        // Hide overlay
        if (startScreen) startScreen.classList.add('hidden');
        
        // Init Audio Context on interaction
        if (audioCtx.state === 'suspended') audioCtx.resume();

        // Play Audio
        if (audio) {
            audio.play().then(() => {
                if (playButton) playButton.textContent = 'MUSIC: ON';
            }).catch(err => {
                console.log("Audio play failed:", err);
                if (playButton) playButton.textContent = 'MUSIC: OFF'; // Should not happen with direct interaction
            });
        }
    };

    if (startScreen) {
        startScreen.addEventListener('click', startGame);
    }

    // Check if game was already started in this session
    if (sessionStorage.getItem('gameStarted') === 'true') {
        // Skip start screen, but audio might be blocked without interaction
        gameStarted = true;
        if (startScreen) startScreen.classList.add('hidden');
        // Try to play audio, might fail
        if (audio) {
            audio.play().catch(() => {
                 console.log("Autoplay blocked, waiting for interaction");
            });
        }
    }

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
    // --- Audio Toggle (Post-Start) ---
    if (playButton) {
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
    }

    // --- Game / Character Logic ---
    const character = document.getElementById('character');
    const heroSection = document.querySelector('.hero-section');
    
    const gravity = 1.2; 
    const groundLevel = 20; 
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
        if (!character) return; // Stop if no character (e.g. About page)
        
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
        const isMobile = window.innerWidth <= 768;
        const currentJumpForce = isMobile ? jumpForce * 0.7 : jumpForce; // Reduced for mobile

        if (keys.ArrowUp && !isJumping) {
            velocityY = currentJumpForce;
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

        // Helper: Check landing on top of an element
        function checkLanding(char, platform, tolerance = 10) {
             const charRect = char.getBoundingClientRect();
             const platRect = platform.getBoundingClientRect();
             
             // Horizontal Check
             if (charRect.right > platRect.left + 15 && charRect.left < platRect.right - 15) {
                // Vertical Check (Falling onto platform)
                const heroRect = heroSection.getBoundingClientRect();
                // Visual top (approximated, since some elements involve transform/clipping)
                const platTopFromBottomPx = heroRect.bottom - platRect.top;
                const platTopPct = (platTopFromBottomPx / heroRect.height) * 100;
                
                // Effective platform height for standing (adjust for visual style)
                // For pipe: rect.top is correct. For blocks: rect.top.
                
                // Compare charY (feet position %) with platTopPct
                if (Math.abs(charY - platTopPct) < tolerance && velocityY <= 0) {
                     return platTopPct;
                }
             }
             return null;
        }

        if (pipe) {
             // Pipe rim offset adjustment (-40px visually)
             const charRect = character.getBoundingClientRect();
             const pipeRect = pipe.getBoundingClientRect();
             if (charRect.right > pipeRect.left + 15 && charRect.left < pipeRect.right - 15) {
                 const heroRect = heroSection.getBoundingClientRect();
                 const pipeVisualTopFromBottomPx = heroRect.bottom - (pipeRect.top - 40);
                 const pipeTopPct = (pipeVisualTopFromBottomPx / heroRect.height) * 100;
                 // Note: Logic duplicated slightly for custom pipe rim offset
                 if (Math.abs(charY - pipeTopPct) < 10 && velocityY <= 0) {
                    onPlatform = true;
                    charY = pipeTopPct; 
                    velocityY = 0;
                    isJumping = false;
                 }
             }
        }
        
        // Check Mystery Blocks (Standable)
        [mysteryBlock, mysteryBlock2].forEach(block => {
            if (block && !onPlatform) {
                const landingY = checkLanding(character, block);
                if (landingY !== null) {
                    onPlatform = true;
                    charY = landingY;
                    velocityY = 0;
                    isJumping = false;
                }
            }
        });

        // Apply Velocity if not stuck on platform
        if (!onPlatform) {
             charY += velocityY;
        }

        // Ground Collision (Floor)
        if (charY <= groundLevel) {
            charY = groundLevel;
            velocityY = 0;
            isJumping = false;
        }

        // Apply Styles - ONLY if not animating (piping/teleporting)
        if (!character.dataset.piping && !character.dataset.teleporting) {
            let transform = `translateX(-50%)`;
            if (!facingRight) transform += ` scaleX(-1)`;
            if (keys.ArrowDown) transform += ` scaleY(0.7) translateY(30%)`; 

            character.style.transform = transform;
            character.style.left = `${charX}%`;
            character.style.bottom = `${charY}%`;
        }

        // Check Collisions (Items/Interactions)
        // Note: We need to handle block hitting from bottom separately in main checkInteractions logic
        if (typeof checkInteractions === 'function') {
            checkInteractions();
        }

        requestAnimationFrame(gameLoop);
    }

    // Swipe Logic
    let touchStartX = 0;
    let touchStartY = 0;
    
    if (heroSection) {
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

            if (Math.abs(diffX) > 30) {
                if (diffX > 0) keys.ArrowRight = true;
                else keys.ArrowLeft = true;
            } else {
                keys.ArrowRight = false;
                keys.ArrowLeft = false;
            }

            // Swipe Up (Jump)
            if (diffY < -50 && !isJumping) { 
                 keys.ArrowUp = true;
                 setTimeout(() => keys.ArrowUp = false, 300);
            }

            // Swipe Down (Crouch / Enter Pipe)
            if (diffY > 50) {
                keys.ArrowDown = true;
                setTimeout(() => keys.ArrowDown = false, 500);
            }
        }, {passive: false});

        heroSection.addEventListener('touchend', (e) => {
            keys.ArrowLeft = false;
            keys.ArrowRight = false;
        });
    }

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

            // Hide Character during transition (prevent flicker)
            character.style.opacity = '0';

            // Trigger Pipe Exit Animation
            setTimeout(() => {
                exitPipeAnimation();
            }, 800); // Wait for scroll
        });
    });

    function exitPipeAnimation() {
        if (!document.getElementById('pipe')) return;
        const pipe = document.getElementById('pipe');
        
        // 0. Set Animating State to prevent gameLoop interference
        character.dataset.piping = "true";
        character.dataset.teleporting = "true"; // Double safety

        // 1. Position Character Inside Pipe (Deep)
        const pipeCenter = pipe.offsetLeft + pipe.offsetWidth / 2;
        const screenW = heroSection.offsetWidth;
        const centerPct = (pipeCenter / screenW) * 100;
        
        // Disable transitions for instant reset
        character.style.transition = 'none';
        character.style.opacity = '1'; // Show Character
        character.style.left = `${centerPct}%`;
        character.style.bottom = '-50%'; // Deep inside pipe
        character.style.zIndex = '5'; // BEHIND PIPE (pipe is 10)
        character.style.transformOrigin = 'bottom center';
        
        // Thin and Long - Set initial state
        character.style.transform = 'translateX(-50%) scaleX(0.4) scaleY(1.8)'; 
        
        // Force Reflow
        void character.offsetWidth;
        
        // 2. Animate Up (Slide) - Step 1
        playGameSound('warp');
        
        // Calculate Top of Pipe (Rim)
        const heroRect = heroSection.getBoundingClientRect();
        const pipeRect = pipe.getBoundingClientRect();
        // Pipe visual top is pipeRect.top - 40px (rim offset visually)
        const pipeVisualTopFromBottomPx = heroRect.bottom - (pipeRect.top - 40);
        const pipeTopPct = (pipeVisualTopFromBottomPx / heroRect.height) * 100;

        requestAnimationFrame(() => {
            character.style.transition = 'bottom 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            character.style.bottom = `${pipeTopPct}%`; // Slide to Rim Top
            
            // 3. Animate Restore (Unscale & Pop) - Step 2 (After Slide finishes)
            setTimeout(() => {
                 character.style.transition = 'transform 0.4s ease-out';
                 character.style.transform = 'translateX(-50%) scale(1)';
                 
                 // Restore Z-Index (Pop out)
                 character.style.zIndex = '20'; 
                 
                 // Little hop effect
                 character.style.bottom = `${pipeTopPct + 5}%`;
                 setTimeout(() => {
                     character.style.transition = 'bottom 0.2s ease-out';
                     character.style.bottom = `${pipeTopPct}%`;
                 }, 200);

            }, 1200); // 1.2s slide time
            
            // 4. Cleanup - Step 3 (After Unscale finishes)
            setTimeout(() => {
                 character.style.zIndex = ''; 
                 character.style.transition = '';
                 character.style.transformOrigin = '';
                 character.style.transform = '';
                 
                 // Ensure physics knows we are there
                 charX = centerPct;
                 charY = pipeTopPct; 
                 velocityY = 0; 
                 
                 delete character.dataset.piping;
                 delete character.dataset.teleporting;
            }, 1800); // 1.2s + 0.6s
        });
    }

    // --- Game Elements Logic ---
    const mysteryBlock = document.getElementById('mystery-block');
    const mysteryBlock2 = document.getElementById('mystery-block-2'); // New Block
    const star = document.getElementById('star');
    const mushroom = document.getElementById('mushroom'); // Poison Mushroom
    const pipe = document.getElementById('pipe');
    const portal = document.getElementById('portal');

    // Star Physics State
    let starX = 45; // Initial %
    let starY = 45; // Initial %
    let starSpeed = 0.5; // Movement speed
    let starRunning = false;

    // Enhanced Collision Detection
    function checkCollision(char, el) {
        let r1 = char.getBoundingClientRect();
        const r2 = el.getBoundingClientRect();
        
        const shrinkX = r1.width * 0.4; 
        const shrinkY = r1.height * 0.2;
        
        const bodyBox = {
            left: r1.left + shrinkX / 2,
            right: r1.right - shrinkX / 2,
            top: r1.top + shrinkY, 
            bottom: r1.bottom,
            width: r1.width - shrinkX,
            height: r1.height - shrinkY,
            centerX: r1.left + r1.width / 2,
            centerY: r1.top + r1.height / 2
        };

        const overlap = !(bodyBox.right < r2.left || 
                         bodyBox.left > r2.right || 
                         bodyBox.bottom < r2.top || 
                         bodyBox.top > r2.bottom);
        
        if (!overlap) return null;

        const dx = bodyBox.centerX - (r2.left + r2.width / 2);
        const dy = bodyBox.centerY - (r2.top + r2.height / 2);
        const combinedHalfWidth = (bodyBox.width + r2.width) / 2;
        const combinedHalfHeight = (bodyBox.height + r2.height) / 2;
        const overlapX = combinedHalfWidth - Math.abs(dx);
        const overlapY = combinedHalfHeight - Math.abs(dy);

        if (overlapX > overlapY) {
            if (dy > 0) return 'bottom'; 
            return 'top'; 
        } else {
            return 'side';
        }
    }

    function checkInteractions() {
        if (!gameStarted) return;

        // --- Mystery Block Logic (HEAD BONK) ---
        if (mysteryBlock) {
            const col = checkCollision(character, mysteryBlock);
            if (col) {
                // Robust Check: Is Below and moved slightly up or hovering
                const charRect = character.getBoundingClientRect();
                const blockRect = mysteryBlock.getBoundingClientRect();
                const charCenterY = charRect.top + charRect.height / 2;
                const blockCenterY = blockRect.top + blockRect.height / 2;
                
                const isBelow = charCenterY > blockCenterY;
                
                if (isBelow && velocityY > -5 && !mysteryBlock.classList.contains('empty')) {
                     playGameSound('bump'); // SOUND
                     mysteryBlock.classList.add('empty');
                     mysteryBlock.classList.add('bounce');
                     setTimeout(() => mysteryBlock.classList.remove('bounce'), 200);

                     // Reveal Star
                     if (star && !starRunning) {
                         setTimeout(() => playGameSound('coin'), 100); // SOUND
                         star.classList.remove('hidden');
                         star.classList.add('popped');
                         starRunning = true; // Start running
                     }
                     
                     velocityY = -2; 
                } 
            }
        }

        // --- Mystery Block 2 Logic (Mushroom) ---
        if (mysteryBlock2) {
            const col = checkCollision(character, mysteryBlock2);
            if (col) {
                 const charRect = character.getBoundingClientRect();
                 const blockRect = mysteryBlock2.getBoundingClientRect();
                 const charCenterY = charRect.top + charRect.height / 2;
                 const blockCenterY = blockRect.top + blockRect.height / 2;
                 
                 const isBelow = charCenterY > blockCenterY;
                 
                 if (isBelow && velocityY > -5 && !mysteryBlock2.classList.contains('empty')) {
                      playGameSound('bump');
                      mysteryBlock2.classList.add('empty');
                      mysteryBlock2.classList.add('bounce');
                      setTimeout(() => mysteryBlock2.classList.remove('bounce'), 200);

                      // Reveal Mushroom
                      if (mushroom) {
                          setTimeout(() => playGameSound('powerup'), 100); // sound
                          mushroom.classList.remove('hidden');
                          mushroom.classList.add('popped');
                      }
                      velocityY = -2;
                 }
            }
        }

        // --- Star Logic (Movement & Collection) ---
        if (star && starRunning && !star.classList.contains('collected')) {
            // Apply Physics (Run Right)
            starX += starSpeed;
            if (starX > 95) starSpeed = -starSpeed; // Bounce off right wall
            if (starX < 0) starSpeed = -starSpeed; // Bounce off left wall
            
            star.style.left = `${starX}%`;
            // starY could bounce too? simplified for now.
            
            if (checkCollision(character, star)) {
                playGameSound('powerup');
                star.classList.add('collected');
                console.log("Star Collected! Growing!");
                
                character.classList.remove('tiny'); // Remove poison
                character.classList.add('giant');
                
                starRunning = false;
            }
        }

        // --- Mushroom Collection (Poison) ---
        if (mushroom && mushroom.classList.contains('popped') && !mushroom.classList.contains('collected')) {
             if (checkCollision(character, mushroom)) {
                 playGameSound('bump'); // Bad sound?
                 mushroom.classList.add('collected');
                 mushroom.style.display = 'none'; // Poof
                 console.log("Mushroom Eaten! Shrinking!");
                 
                 character.classList.remove('giant'); // Remove star power
                 character.classList.add('tiny');
             }
        }

        // --- Portal (BODY) ---
        if (portal && !character.dataset.teleporting) {
            const charRect = character.getBoundingClientRect();
            const portalRect = portal.getBoundingClientRect();
            
            const charCenterX = charRect.left + charRect.width / 2;
            const charCenterY = charRect.top + charRect.height / 2;
            
            const portalCenterX = portalRect.left + portalRect.width / 2;
            const portalCenterY = portalRect.top + portalRect.height / 2;
            
            // Distance Calculation (hypotenuse)
            const dist = Math.sqrt(Math.pow(charCenterX - portalCenterX, 2) + Math.pow(charCenterY - portalCenterY, 2));
            
            // Threshold: 35% of portal width (Assume circular hitbox)
            // Portal width is 300px, so ~105px radius collision zone.
            const hitRadius = portalRect.width * 0.35; 
            
            if (dist < hitRadius) {
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
        if (pipe) {
            const col = checkCollision(character, pipe);
            
            // Relaxed alignment to 50px
            if (col === 'top' || (Math.abs((character.getBoundingClientRect().left + character.getBoundingClientRect().width/2) - (pipe.getBoundingClientRect().left + pipe.getBoundingClientRect().width/2)) < 50)) {
                if (keys.ArrowDown && !character.dataset.piping) {
                    // Must be effective grounded
                    if (Math.abs(velocityY) < 1) { 
                        character.dataset.piping = "true";
                        console.log("Entering Pipe...");
                        
                        // SOUND
                        playGameSound('warp');
                        
                        // 1. Center Character on Pipe (Visual Snap)
                        const pipeCenter = pipe.offsetLeft + pipe.offsetWidth / 2;
                        const screenW = heroSection.offsetWidth;
                        const centerPct = (pipeCenter / screenW) * 100;
                        
                        charX = centerPct; 
                        character.style.left = `${charX}%`;
                        
                        // 2. Animation Sequence
                        character.style.zIndex = 5; // Behind Pipe (z-index 10)
                        character.style.transformOrigin = "bottom center";
                        
                        // Step 1: Squish (Thin/Long) - Immediate start
                        character.style.transition = "transform 0.4s ease-in, bottom 1.0s linear";
                        character.style.transform = "translateX(-50%) scaleX(0.4) scaleY(1.8)"; 
                        
                        // Step 2: Slide Deep (Simultaneous with squish)
                        setTimeout(() => {
                             character.style.bottom = "-50%"; // Deep down
                        }, 50); // Small delay to ensure transition triggers
                        
                        const transitionOverlay = document.getElementById('pipe-transition');
                        
                        // Step 3: Trigger Navigate (After Slide)
                        setTimeout(() => {
                            if (transitionOverlay) transitionOverlay.classList.add('active');
                            
                            setTimeout(() => {
                                // 4. Scroll & Reset
                                const mapSection = document.getElementById('explore');
                                if (mapSection) mapSection.scrollIntoView({ behavior: 'auto' }); 
                                
                                // Reset Character
                                character.style.transition = ""; 
                                charY = groundLevel; 
                                character.style.bottom = `${charY}%`;
                                character.style.zIndex = ""; 
                                delete character.dataset.piping;
                                // Reset transform to normal
                                character.style.transform = "translateX(-50%) scale(1)";

                                setTimeout(() => {
                                    if (transitionOverlay) transitionOverlay.classList.remove('active');
                                }, 500);

                            }, 800); 
                        }, 1200); // 1.2s total animation time
                    }
                }
            }
        }
    }
    
    // --- Mobile Optimization: Force Scroll to Top ---
    window.addEventListener('load', () => {
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 100); 
    });

    // Initial Call
    gameLoop();
});