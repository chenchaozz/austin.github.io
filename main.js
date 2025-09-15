(function () {
    const DAYS_PER_YEAR = 365.25; // 平均回归年
    const HOURS_PER_DAY = 24;
    const MINUTES_PER_HOUR = 60;
    const SECONDS_PER_MINUTE = 60;

    // 根据设定：米勒星 1 小时 = 地球 7 年
    const EARTH_YEARS_PER_MILLER_HOUR = 7;
    const EARTH_HOURS_PER_MILLER_HOUR = EARTH_YEARS_PER_MILLER_HOUR * DAYS_PER_YEAR * HOURS_PER_DAY; // 61362 小时
    const EARTH_SECONDS_PER_YEAR = DAYS_PER_YEAR * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE; // 31557600 秒

    const els = {
        earth: {
            startDate: document.getElementById('earth-start-date'),
            endDate: document.getElementById('earth-end-date')
        },
        miller: {
            hours: document.getElementById('miller-hours'),
            minutes: document.getElementById('miller-minutes'),
            seconds: document.getElementById('miller-seconds')
        },
        summary: document.getElementById('summary'),
        year: document.getElementById('year'),
        backgroundMusic: document.querySelector('.background-music'),
        musicPrompt: document.getElementById('music-prompt'),
        playMusicBtn: document.getElementById('play-music-btn')
    };

    if (els.year) els.year.textContent = new Date().getFullYear().toString();

    // 背景音乐播放控制
    function playBackgroundMusic() {
        if (els.backgroundMusic) {
            els.backgroundMusic.volume = 0.3; // 设置音量为30%
            els.backgroundMusic.loop = true;
            
            const playPromise = els.backgroundMusic.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // 播放成功，隐藏提示框
                    hideMusicPrompt();
                }).catch(error => {
                    console.log('自动播放被阻止，显示用户交互提示');
                    showMusicPrompt();
                });
            }
        }
    }

    // 显示音乐播放提示
    function showMusicPrompt() {
        if (els.musicPrompt) {
            els.musicPrompt.style.display = 'block';
        }
    }

    // 隐藏音乐播放提示
    function hideMusicPrompt() {
        if (els.musicPrompt) {
            els.musicPrompt.style.display = 'none';
        }
    }

    // 手动播放音乐
    function startMusic() {
        if (els.backgroundMusic) {
            els.backgroundMusic.play().then(() => {
                hideMusicPrompt();
            }).catch(e => {
                console.log('播放失败:', e);
            });
        }
    }

    // 页面加载完成后立即尝试播放音乐
    function initBackgroundMusic() {
        // DOM加载完成后尝试播放
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', playBackgroundMusic);
        } else {
            playBackgroundMusic();
        }
    }

    function clampNonNegative(value) {
        const n = Number(value);
        return Number.isFinite(n) && n >= 0 ? n : 0;
    }

    // 仅支持地球 -> 米勒
    function setDirection() {
        document.getElementById('earth-panel').classList.add('active');
        document.getElementById('miller-panel').classList.remove('active');
    }

    function parseLocalDate(dateStr) {
        if (!dateStr) return null;
        const [y, m, d] = dateStr.split('-').map(Number);
        if (!y || !m || !d) return null;
        return new Date(y, m - 1, d, 0, 0, 0, 0);
    }

    function earthToHours(earth) {
        const start = parseLocalDate(earth.startDate && earth.startDate.value);
        const end = parseLocalDate(earth.endDate && earth.endDate.value);
        if (!start || !end) return 0;
        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours > 0 ? diffHours : 0;
    }

    function hoursToEarthFields(totalHours) {
        const totalSeconds = totalHours * MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
        let remaining = totalSeconds;
        const years = Math.floor(remaining / EARTH_SECONDS_PER_YEAR);
        remaining -= years * EARTH_SECONDS_PER_YEAR;
        const days = Math.floor(remaining / (HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE));
        remaining -= days * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
        const hours = Math.floor(remaining / (MINUTES_PER_HOUR * SECONDS_PER_MINUTE));
        remaining -= hours * MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
        const minutes = Math.floor(remaining / SECONDS_PER_MINUTE);
        remaining -= minutes * SECONDS_PER_MINUTE;
        const seconds = +remaining.toFixed(3);
        return { years, days, hours, minutes, seconds };
    }

    function millerToHours(miller) {
        const hours = clampNonNegative(miller.hours.value);
        const minutes = clampNonNegative(miller.minutes.value);
        const seconds = clampNonNegative(miller.seconds.value);
        return hours + minutes / MINUTES_PER_HOUR + seconds / (MINUTES_PER_HOUR * SECONDS_PER_MINUTE);
    }

    let isUpdating = false;

    function updateFromEarth() {
        if (isUpdating) return; isUpdating = true;
        const earthHours = earthToHours(els.earth);
        const millerHours = earthHours / EARTH_HOURS_PER_MILLER_HOUR;
        const mh = Math.floor(millerHours);
        const mm = Math.floor((millerHours - mh) * MINUTES_PER_HOUR);
        const ms = ((millerHours - mh) * MINUTES_PER_HOUR - mm) * SECONDS_PER_MINUTE;
        els.miller.hours.value = mh.toFixed(0);
        els.miller.minutes.value = mm.toFixed(0);
        els.miller.seconds.value = ms.toFixed(3);
        renderSummary(earthHours, millerHours);
        isUpdating = false;
    }

    // 去除米勒 -> 地球逻辑

    function renderSummary(earthHours, millerHours) {
        const earthYears = earthHours / (DAYS_PER_YEAR * HOURS_PER_DAY);
        const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 });
        els.summary.textContent = `地球约 ${formatter.format(earthYears)} 年 ≈ 米勒星 ${formatter.format(millerHours)} 小时`;
    }

    function addListeners() {
        // 输入变化时实时换算（仅地球日期触发）
        ['input', 'change'].forEach(evt => {
            Object.values(els.earth).forEach(input => {
                if (!input) return;
                input.addEventListener(evt, updateFromEarth);
            });
        });


        // 音乐播放按钮点击事件
        if (els.playMusicBtn) {
            els.playMusicBtn.addEventListener('click', startMusic);
        }

        // 页面任意位置点击播放音乐（如果提示框显示中）
        document.addEventListener('click', () => {
            if (els.musicPrompt && els.musicPrompt.style.display !== 'none') {
                startMusic();
            }
        });
    }

    // 初始 UI 状态
    setDirection();
    addListeners();
    updateFromEarth();
    
    // 初始化背景音乐
    initBackgroundMusic();
})();


