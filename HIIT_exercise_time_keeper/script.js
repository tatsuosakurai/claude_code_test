// タイマーの状態を管理
const TimerState = {
    IDLE: 'idle',
    PREPARE: 'prepare',
    WORK: 'work',
    REST: 'rest',
    FINISHED: 'finished'
};

// タイマーの設定と状態
const timer = {
    state: TimerState.IDLE,
    currentTime: 0,
    currentSet: 1,
    interval: null,
    startTime: null,
    totalElapsedTime: 0,
    
    // デフォルト設定
    settings: {
        workTime: 20,
        restTime: 10,
        prepareTime: 10,
        totalSets: 9, // 固定値（メニューの数で動的に変更）
        audioEnabled: true,
        volume: 0.7,
        menu: [
            '腕立て',
            '腕立て(脇締め)',
            'スクワット',
            'バックランジ',
            'バックランジニーアップ',
            'マウンテンクライマー',
            'マウンテンクライマー(ツイスト)',
            'バービー',
            'ニーアップ'
        ]
    }
};

// 音声システム
const audioSystem = {
    context: null,
    initialized: false,
    
    // 音声コンテキストの初期化
    async init() {
        if (this.initialized) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (error) {
            console.warn('Audio context creation failed:', error);
        }
    },
    
    // ビープ音を生成
    async playBeep(frequency = 440, duration = 0.2, volume = 0.7) {
        if (!timer.settings.audioEnabled || !this.context) return;
        
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.context.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
            
            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + duration);
        } catch (error) {
            console.warn('Audio playback failed:', error);
        }
    },
    
    // カウントダウン音（高音、短い）
    playCountdown() {
        this.playBeep(880, 0.1, timer.settings.volume);
    },
    
    // 運動開始音（高音、長め）
    playWorkStart() {
        this.playBeep(880, 0.3, timer.settings.volume);
    },
    
    // 休憩開始音（低音、長め）
    playRestStart() {
        this.playBeep(440, 0.3, timer.settings.volume);
    },
    
    // 完了音（2つの音）
    async playFinish() {
        if (!timer.settings.audioEnabled) return;
        this.playBeep(880, 0.3, timer.settings.volume);
        setTimeout(() => this.playBeep(1100, 0.3, timer.settings.volume), 300);
    }
};

// プリセット管理システム
const presetSystem = {
    // デフォルトプリセット
    defaultPresets: {
        tabata: {
            name: 'タバタ式',
            workTime: 20,
            restTime: 10,
            totalSets: 9,
            audioEnabled: true,
            volume: 0.7
        },
        emom: {
            name: 'EMOM',
            workTime: 45,
            restTime: 15,
            totalSets: 10,
            audioEnabled: true,
            volume: 0.7
        },
        beginner: {
            name: '初心者向け',
            workTime: 15,
            restTime: 15,
            totalSets: 6,
            audioEnabled: true,
            volume: 0.7
        }
    },
    
    // カスタムプリセットをLocalStorageから取得
    getCustomPresets() {
        try {
            const saved = localStorage.getItem('hiit-custom-presets');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Failed to load custom presets:', error);
            return {};
        }
    },
    
    // カスタムプリセットをLocalStorageに保存
    saveCustomPresets(presets) {
        try {
            localStorage.setItem('hiit-custom-presets', JSON.stringify(presets));
        } catch (error) {
            console.warn('Failed to save custom presets:', error);
        }
    },
    
    // プリセットを取得
    getPreset(key) {
        if (this.defaultPresets[key]) {
            return this.defaultPresets[key];
        }
        
        const customPresets = this.getCustomPresets();
        return customPresets[key] || null;
    },
    
    // カスタムプリセットを保存
    savePreset(key, preset) {
        const customPresets = this.getCustomPresets();
        customPresets[key] = preset;
        this.saveCustomPresets(customPresets);
    },
    
    // カスタムプリセットを削除
    deletePreset(key) {
        const customPresets = this.getCustomPresets();
        delete customPresets[key];
        this.saveCustomPresets(customPresets);
    },
    
    // 全カスタムプリセットを取得
    getAllCustomPresets() {
        return this.getCustomPresets();
    }
};

// DOM要素の取得
const elements = {
    timeDisplay: document.getElementById('timeDisplay'),
    status: document.getElementById('status'),
    startBtn: document.getElementById('startBtn'),
    resetBtn: document.getElementById('resetBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    timerDisplay: document.querySelector('.timer-display'),
    // 設定関連の要素
    workTimeInput: document.getElementById('workTimeInput'),
    prepareTimeInput: document.getElementById('prepareTimeInput'),
    menuInput: document.getElementById('menuInput'),
    applySettingsBtn: document.getElementById('applySettingsBtn'),
    // 進捗表示関連の要素
    horizontalProgressBar: document.getElementById('horizontalProgressBar'),
    horizontalProgress: document.getElementById('horizontalProgress'),
    horizontalSetDividers: document.getElementById('horizontalSetDividers'),
    // メニュー表示
    menuDisplay: document.getElementById('menuDisplay')
};

// 初期表示の更新
function updateDisplay() {
    elements.timeDisplay.textContent = timer.currentTime;
    
    // 設定入力フィールドの値を更新
    elements.workTimeInput.value = timer.settings.workTime;
    elements.prepareTimeInput.value = timer.settings.prepareTime;
    elements.menuInput.value = timer.settings.menu.join('\n');
    
    // 進捗表示の更新
    updateProgressDisplay();
    
    // 横セット区切り線の作成
    createHorizontalSetDividers();
}

// タイマーの状態に応じた表示の更新
function updateTimerStyle() {
    elements.timerDisplay.classList.remove('work', 'rest');
    
    switch (timer.state) {
        case TimerState.PREPARE:
            elements.status.textContent = 'READY!!!';
            if (timer.settings.menu.length > 0 && timer.settings.menu[0]) {
                elements.menuDisplay.textContent = `次は: ${timer.settings.menu[0]}`;
            } else {
                elements.menuDisplay.textContent = '';
            }
            break;
        case TimerState.WORK:
            elements.timerDisplay.classList.add('work');
            if (timer.settings.menu.length > 0 && timer.currentSet > 0 && timer.settings.menu[timer.currentSet - 1]) {
                elements.status.textContent = timer.settings.menu[timer.currentSet - 1];
            } else {
                elements.status.textContent = 'WORKING!!!';
            }
            elements.menuDisplay.textContent = '';
            // 運動開始音を再生
            audioSystem.playWorkStart();
            break;
        case TimerState.REST:
            elements.timerDisplay.classList.add('rest');
            elements.status.textContent = 'REST';
            if (timer.settings.menu.length > 0 && timer.currentSet < timer.settings.totalSets) {
                elements.menuDisplay.textContent = `次は: ${timer.settings.menu[timer.currentSet] || ''}`;
            } else {
                elements.menuDisplay.textContent = '';
            }
            // 休憩開始音を再生
            audioSystem.playRestStart();
            break;
        case TimerState.IDLE:
            elements.status.textContent = 'READY!!!';
            elements.menuDisplay.textContent = '';
            break;
        case TimerState.FINISHED:
            elements.status.textContent = 'FINISHED!';
            elements.menuDisplay.textContent = '';
            // 完了音を再生
            audioSystem.playFinish();
            break;
    }
    
    // 初期背景色を設定
    updateTimerBackgroundGradient();
}

// タイマー背景色のグラデーション更新
function updateTimerBackgroundGradient() {
    let progress = 0;
    let progressColor, remainingColor;
    
    if (timer.state === TimerState.WORK) {
        const totalTime = timer.settings.workTime;
        progress = ((totalTime - timer.currentTime) / totalTime) * 100;
        // 運動中：進行部分は赤、残り部分は薄い赤
        progressColor = '#ff6b6b';      // 濃い赤
        remainingColor = '#ffb4b4';     // 薄い赤
    } else if (timer.state === TimerState.REST) {
        const totalTime = timer.settings.restTime;
        progress = ((totalTime - timer.currentTime) / totalTime) * 100;
        // 休憩中：進行部分は緑、残り部分は薄い緑
        progressColor = '#4ecdc4';      // 濃い緑
        remainingColor = '#b4f0dc';     // 薄い緑
    } else if (timer.state === TimerState.PREPARE) {
        const totalTime = timer.settings.prepareTime;
        progress = ((totalTime - timer.currentTime) / totalTime) * 100;
        // 準備中：進行部分は濃いグレー、残り部分は薄いグレー
        progressColor = '#c8c8c8';      // 濃いグレー
        remainingColor = '#f5f5f5';     // 薄いグレー
    } else {
        // IDLE, FINISHED
        elements.timerDisplay.style.background = '';
        return;
    }
    
    // 線形グラデーションで進捗を表示（上から下へ）
    elements.timerDisplay.style.background = 
        `linear-gradient(to bottom, ${progressColor} ${progress}%, ${remainingColor} ${progress}%)`;
}

// 進捗表示を更新
function updateProgressDisplay() {
    // 全体進捗
    let completedSets = 0;
    let currentSetProgress = 0;
    
    if (timer.state === TimerState.FINISHED) {
        completedSets = timer.settings.totalSets;
        currentSetProgress = 0;
    } else if (timer.state === TimerState.PREPARE) {
        completedSets = 0;
        currentSetProgress = 0;
    } else if (timer.state === TimerState.WORK) {
        completedSets = timer.currentSet - 1;
        currentSetProgress = (timer.settings.workTime - timer.currentTime) / timer.settings.workTime;
    } else if (timer.state === TimerState.REST) {
        // 休憩中は現在のセットを完了扱いにする（進捗は上がらない）
        completedSets = timer.currentSet;
        currentSetProgress = 0;
    }
    
    const overallProgressPercent = ((completedSets + currentSetProgress) / timer.settings.totalSets) * 100;
    
    elements.horizontalProgress.style.width = overallProgressPercent + '%';
}

// 横セット区切り線を作成
function createHorizontalSetDividers() {
    // 既存の区切り線を削除
    elements.horizontalSetDividers.innerHTML = '';
    
    // 各セットの領域にセット番号を表示
    for (let i = 0; i < timer.settings.totalSets; i++) {
        const setLabel = document.createElement('div');
        setLabel.className = 'horizontal-set-label';
        const leftPosition = (i / timer.settings.totalSets) * 100;
        const width = (1 / timer.settings.totalSets) * 100;
        setLabel.style.left = leftPosition + '%';
        setLabel.style.width = width + '%';
        setLabel.textContent = i + 1;
        elements.horizontalSetDividers.appendChild(setLabel);
    }
    
    // セット毎のグラデーション背景を作成
    updateSetGradientBackground();
}

// セット毎のグラデーション背景を更新
function updateSetGradientBackground() {
    const progressBar = elements.horizontalProgressBar;
    const totalSets = timer.settings.totalSets;
    
    // 同系色（青系）で明度を変化させる
    const colors = [];
    for (let i = 0; i < totalSets; i++) {
        // 青系の色相（200-220度）で、明度を変化させる
        const hue = 210;
        const saturation = 30;  // 彩度を少し上げて視認性を向上
        const lightness = 75 - (i * 25 / totalSets); // 75%から50%まで変化（最初からしっかり濃い目に）
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    
    // グラデーションストップを生成（境目をはっきりさせる）
    const gradientStops = [];
    for (let i = 0; i < totalSets; i++) {
        const startPercent = (i / totalSets) * 100;
        const endPercent = ((i + 1) / totalSets) * 100;
        
        // 各セットの色を開始から終了まで同じ色で塗る
        gradientStops.push(`${colors[i]} ${startPercent}%`);
        gradientStops.push(`${colors[i]} ${endPercent}%`);
    }
    
    progressBar.style.background = `linear-gradient(to right, ${gradientStops.join(', ')})`;
}

// 運動のハーフタイムで通知
function checkHalfTime() {
    if (timer.state === TimerState.WORK) {
        const halfway = Math.floor(timer.settings.workTime / 2);
        if (timer.currentTime === halfway) {
            audioSystem.playCountdown();
        }
    }
}

// 時間をMM:SS形式にフォーマット
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// カウントダウン処理
function countdown() {
    timer.currentTime--;
    elements.timeDisplay.textContent = timer.currentTime;
    
    // 進捗表示を更新
    updateProgressDisplay();
    
    // 背景色のグラデーション更新
    updateTimerBackgroundGradient();
    
    // ハーフタイム通知をチェック
    checkHalfTime();
    
    // カウントダウン音（3,2,1）
    if (timer.currentTime <= 3 && timer.currentTime > 0) {
        audioSystem.playCountdown();
    }
    
    if (timer.currentTime <= 0) {
        // 現在の状態に応じて次の状態へ遷移
        if (timer.state === TimerState.PREPARE) {
            // 準備時間終了、最初の運動へ
            timer.state = TimerState.WORK;
            timer.currentSet = 1;
            timer.currentTime = timer.settings.workTime;
            updateTimerStyle();
        } else if (timer.state === TimerState.WORK) {
            if (timer.currentSet === timer.settings.totalSets) {
                // 最後のセット完了
                finishTimer();
            } else {
                // 休憩へ移行
                timer.state = TimerState.REST;
                timer.currentTime = timer.settings.restTime;
                updateTimerStyle();
            }
        } else if (timer.state === TimerState.REST) {
            // 次のセットへ
            timer.currentSet++;
            timer.state = TimerState.WORK;
            timer.currentTime = timer.settings.workTime;
            updateTimerStyle();
        }
    }
}

// タイマー開始
async function startTimer() {
    // 音声システムを初期化（ユーザーアクションが必要）
    await audioSystem.init();
    
    if (timer.state === TimerState.IDLE || timer.state === TimerState.FINISHED) {
        // 初回開始時は準備時間から
        timer.currentSet = 0;
        timer.state = TimerState.PREPARE;
        timer.currentTime = timer.settings.prepareTime;
        timer.startTime = Date.now();
        timer.totalElapsedTime = 0;
        updateTimerStyle();
    } else if (!timer.startTime) {
        // 一時停止からの再開時で開始時間が設定されていない場合
        timer.startTime = Date.now() - timer.totalElapsedTime * 1000;
    }
    
    // ボタンの状態を更新
    elements.startBtn.disabled = true;
    
    // インターバルを開始
    timer.interval = setInterval(countdown, 1000);
}

// タイマー停止
function stopTimer() {
    if (timer.interval) {
        clearInterval(timer.interval);
        timer.interval = null;
    }
    
    // ボタンの状態を更新
    elements.startBtn.disabled = false;
}

// タイマーリセット
function resetTimer() {
    stopTimer();
    timer.state = TimerState.IDLE;
    timer.currentSet = 1;
    timer.currentTime = timer.settings.prepareTime;
    timer.startTime = null;
    timer.totalElapsedTime = 0;
    updateDisplay();
    updateTimerStyle();
}

// タイマー完了
function finishTimer() {
    stopTimer();
    timer.state = TimerState.FINISHED;
    updateTimerStyle();
}

// 設定の検証
function validateSettings() {
    const workTime = parseInt(elements.workTimeInput.value);
    const prepareTime = parseInt(elements.prepareTimeInput.value);
    const menuText = elements.menuInput.value.trim();
    
    // 値の検証
    if (isNaN(workTime) || workTime < 1 || workTime > 999) {
        alert('運動時間は1〜999の間で入力してください');
        return false;
    }
    
    if (isNaN(prepareTime) || prepareTime < 1 || prepareTime > 999) {
        alert('準備時間は1〜999の間で入力してください');
        return false;
    }

    const menu = menuText.split(/[\s\n,]+/).filter(item => item);
    const totalSets = menu.length || 9; // メニューの数に応じてセット数を決定
    
    return { 
        workTime, 
        prepareTime, 
        totalSets,
        menu,
        restTime: timer.settings.restTime,
        audioEnabled: timer.settings.audioEnabled,
        volume: timer.settings.volume
    };
}

// 設定の適用
function applySettings() {
    // タイマーが動作中の場合は適用しない
    if (timer.interval) {
        alert('タイマー動作中は設定を変更できません');
        return;
    }
    
    const validatedSettings = validateSettings();
    if (!validatedSettings) return;
    
    // 設定を更新
    timer.settings = validatedSettings;
    
    // 設定を保存
    saveSettings();
    
    // タイマーをリセット
    timer.state = TimerState.IDLE;
    timer.currentSet = 1;
    timer.currentTime = timer.settings.prepareTime;
    timer.startTime = null;
    timer.totalElapsedTime = 0;
    
    // 表示を更新
    updateDisplay();
    updateTimerStyle();
    
    // 横セット区切り線を再作成
    createHorizontalSetDividers();
    
    // 設定パネルを閉じる
    elements.settingsPanel.classList.add('hidden');
    
    // フィードバック
    const applyBtn = elements.applySettingsBtn;
    const originalText = applyBtn.textContent;
    applyBtn.textContent = '✓ 適用しました';
    applyBtn.style.backgroundColor = '#4ecdc4';
    
    setTimeout(() => {
        applyBtn.textContent = originalText;
        applyBtn.style.backgroundColor = '';
    }, 1500);
}

// 設定パネルの表示/非表示切り替え
function toggleSettings() {
    elements.settingsPanel.classList.toggle('hidden');
}

// スーパーリロード機能
let resetPressTimer = null;
let isLongPress = false;

async function superReload() {
    // 視覚的フィードバック
    elements.resetBtn.style.backgroundColor = '#ff6b6b';
    elements.resetBtn.innerHTML = '<span class="btn-icon">⟳</span>';
    
    // Service Workerのキャッシュをクリア
    if ('caches' in window) {
        try {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
            console.log('All caches cleared');
        } catch (error) {
            console.error('Failed to clear caches:', error);
        }
    }
    
    // Service Workerの更新を強制
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    
    // LocalStorageをクリア（設定は保持）
    const settings = localStorage.getItem('hiit-timer-settings');
    localStorage.clear();
    if (settings) {
        localStorage.setItem('hiit-timer-settings', settings);
    }
    
    // フィードバック表示
    setTimeout(() => {
        window.location.reload(true);
    }, 300);
}

// イベントリスナーの設定
elements.startBtn.addEventListener('click', startTimer);

// リセットボタンの通常クリックと長押しを処理
elements.resetBtn.addEventListener('mousedown', () => {
    isLongPress = false;
    elements.resetBtn.classList.add('long-pressing');
    resetPressTimer = setTimeout(() => {
        isLongPress = true;
        superReload();
    }, 1000); // 1秒長押しでスーパーリロード
});

elements.resetBtn.addEventListener('mouseup', () => {
    clearTimeout(resetPressTimer);
    elements.resetBtn.classList.remove('long-pressing');
    if (!isLongPress) {
        resetTimer();
    }
});

elements.resetBtn.addEventListener('mouseleave', () => {
    clearTimeout(resetPressTimer);
    elements.resetBtn.classList.remove('long-pressing');
});

// タッチデバイス対応
elements.resetBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // デフォルトのタッチ動作を防ぐ
    isLongPress = false;
    elements.resetBtn.classList.add('long-pressing');
    resetPressTimer = setTimeout(() => {
        isLongPress = true;
        superReload();
    }, 1000);
});

elements.resetBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    clearTimeout(resetPressTimer);
    elements.resetBtn.classList.remove('long-pressing');
    if (!isLongPress) {
        resetTimer();
    }
});

elements.resetBtn.addEventListener('touchcancel', () => {
    clearTimeout(resetPressTimer);
    elements.resetBtn.classList.remove('long-pressing');
});

elements.settingsBtn.addEventListener('click', toggleSettings);
elements.applySettingsBtn.addEventListener('click', applySettings);

// 入力フィールドのリアルタイムバリデーション
elements.workTimeInput.addEventListener('input', (e) => {
    if (e.target.value < 1) e.target.value = 1;
    if (e.target.value > 999) e.target.value = 999;
});

elements.prepareTimeInput.addEventListener('input', (e) => {
    if (e.target.value < 1) e.target.value = 1;
    if (e.target.value > 999) e.target.value = 999;
});


// 設定をLocalStorageから読み込む
function loadSettings() {
    try {
        const saved = localStorage.getItem('hiit-timer-settings');
        if (saved) {
            const loadedSettings = JSON.parse(saved);
            // 既存の設定とマージ（新しいプロパティがある場合に対応）
            timer.settings = { ...timer.settings, ...loadedSettings };
            
            // メニューが空の場合はデフォルトメニューを使用
            if (!timer.settings.menu || timer.settings.menu.length === 0) {
                timer.settings.menu = [
                    '腕立て',
                    '腕立て(脇締め)',
                    'スクワット',
                    'バックランジ',
                    'バックランジニーアップ',
                    'マウンテンクライマー',
                    'マウンテンクライマー(ツイスト)',
                    'バービー',
                    'ニーアップ'
                ];
                timer.settings.totalSets = 9;
            }
        }
    } catch (error) {
        console.warn('Failed to load settings:', error);
    }
}

// 設定をLocalStorageに保存する
function saveSettings() {
    try {
        localStorage.setItem('hiit-timer-settings', JSON.stringify(timer.settings));
    } catch (error) {
        console.warn('Failed to save settings:', error);
    }
}

// 初期化
loadSettings();
updateDisplay();
updateTimerStyle();