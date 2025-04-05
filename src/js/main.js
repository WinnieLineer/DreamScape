// 手機選單切換
document.querySelector('.menu-toggle').addEventListener('click', function() {
    document.querySelector('.navbar ul').classList.toggle('active');
});

// 背景音樂控制
const audio = document.getElementById('bgMusic');
const playButton = document.getElementById('music-control');

// 嘗試解除靜音並播放
function tryPlayAudio() {
    if (audio.paused) {
        audio.muted = false;
        audio.play().catch(error => {
            console.log('自動播放失敗:', error);
        });
    }
}

// 在用戶與頁面互動時嘗試播放
document.addEventListener('click', function() {
    tryPlayAudio();
    // 移除事件監聽器，避免重複觸發
    document.removeEventListener('click', arguments.callee);
});

// 點擊按鈕控制音樂
playButton.addEventListener('click', function() {
    if (audio.paused) {
        audio.muted = false;
        audio.play();
        playButton.textContent = '暫停背景音樂';
    } else {
        audio.pause();
        playButton.textContent = '播放背景音樂';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // 導航欄響應式功能
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.navbar ul');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', function() {
            navList.classList.toggle('active');
        });

        // 點擊導航連結後關閉選單
        const navLinks = document.querySelectorAll('.navbar ul li a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    navList.classList.remove('active');
                }
            });
        });

        // 視窗大小改變時重置選單狀態
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                navList.classList.remove('active');
            }
        });
    }
}); 