// タイマーの状態を管理
const TimerState = {
    IDLE: 'idle',
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
    
    // デフォルト設定
    settings: {
        workTime: 20,
        restTime: 10,
        totalSets: 8,
        audioEnabled: true,
        volume: 0.7
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

// DOM要素の取得
const elements = {
    timeDisplay: document.getElementById('timeDisplay'),
    status: document.getElementById('status'),
    currentSet: document.getElementById('currentSet'),
    totalSets: document.getElementById('totalSets'),
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    resetBtn: document.getElementById('resetBtn'),
    timerDisplay: document.querySelector('.timer-display'),
    nextAction: document.getElementById('nextAction'),
    // 設定関連の要素
    workTimeInput: document.getElementById('workTimeInput'),
    restTimeInput: document.getElementById('restTimeInput'),
    setCountInput: document.getElementById('setCountInput'),
    applySettingsBtn: document.getElementById('applySettingsBtn'),
    // 音声関連の要素
    audioEnabled: document.getElementById('audioEnabled'),
    volumeSlider: document.getElementById('volumeSlider'),
    volumeDisplay: document.getElementById('volumeDisplay')
};

// 初期表示の更新
function updateDisplay() {
    elements.timeDisplay.textContent = timer.currentTime;
    elements.currentSet.textContent = timer.currentSet;
    elements.totalSets.textContent = timer.settings.totalSets;
    
    // 設定入力フィールドの値を更新
    elements.workTimeInput.value = timer.settings.workTime;
    elements.restTimeInput.value = timer.settings.restTime;
    elements.setCountInput.value = timer.settings.totalSets;
    
    // 音声設定の更新
    elements.audioEnabled.checked = timer.settings.audioEnabled;
    elements.volumeSlider.value = Math.round(timer.settings.volume * 100);
    elements.volumeDisplay.textContent = Math.round(timer.settings.volume * 100) + '%';
}

// タイマーの状態に応じた表示の更新
function updateTimerStyle() {
    elements.timerDisplay.classList.remove('work', 'rest');
    elements.nextAction.textContent = '';
    
    switch (timer.state) {
        case TimerState.WORK:
            elements.timerDisplay.classList.add('work');
            elements.status.textContent = '運動中';
            if (timer.currentSet < timer.settings.totalSets) {
                elements.nextAction.textContent = `次：休憩 ${timer.settings.restTime}秒`;
            } else {
                elements.nextAction.textContent = '次：完了！';
            }
            // 運動開始音を再生
            audioSystem.playWorkStart();
            break;
        case TimerState.REST:
            elements.timerDisplay.classList.add('rest');
            elements.status.textContent = '休憩中';
            elements.nextAction.textContent = `次：運動 ${timer.settings.workTime}秒`;
            // 休憩開始音を再生
            audioSystem.playRestStart();
            break;
        case TimerState.IDLE:
            elements.status.textContent = '準備完了';
            elements.nextAction.textContent = 'スタートボタンを押してください';
            break;
        case TimerState.FINISHED:
            elements.status.textContent = '完了！';
            elements.nextAction.textContent = 'お疲れさまでした！';
            // 完了音を再生
            audioSystem.playFinish();
            break;
    }
}

// カウントダウン処理
function countdown() {
    timer.currentTime--;
    elements.timeDisplay.textContent = timer.currentTime;
    
    // カウントダウン音（3,2,1）
    if (timer.currentTime <= 3 && timer.currentTime > 0) {
        audioSystem.playCountdown();
    }
    
    if (timer.currentTime <= 0) {
        // 現在の状態に応じて次の状態へ遷移
        if (timer.state === TimerState.WORK) {
            // 休憩へ移行
            timer.state = TimerState.REST;
            timer.currentTime = timer.settings.restTime;
            updateTimerStyle();
        } else if (timer.state === TimerState.REST) {
            // 次のセットへ
            timer.currentSet++;
            
            if (timer.currentSet > timer.settings.totalSets) {
                // 全セット完了
                finishTimer();
            } else {
                // 次のセットの運動へ
                timer.state = TimerState.WORK;
                timer.currentTime = timer.settings.workTime;
                elements.currentSet.textContent = timer.currentSet;
                updateTimerStyle();
            }
        }
    }
}

// タイマー開始
async function startTimer() {
    // 音声システムを初期化（ユーザーアクションが必要）
    await audioSystem.init();
    
    if (timer.state === TimerState.IDLE || timer.state === TimerState.FINISHED) {
        // 初回開始時
        timer.currentSet = 1;
        timer.state = TimerState.WORK;
        timer.currentTime = timer.settings.workTime;
        updateTimerStyle();
    }
    
    // ボタンの状態を更新
    elements.startBtn.disabled = true;
    elements.stopBtn.disabled = false;
    
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
    elements.stopBtn.disabled = true;
}

// タイマーリセット
function resetTimer() {
    stopTimer();
    timer.state = TimerState.IDLE;
    timer.currentSet = 1;
    timer.currentTime = timer.settings.workTime;
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
    const restTime = parseInt(elements.restTimeInput.value);
    const totalSets = parseInt(elements.setCountInput.value);
    
    // 値の検証
    if (isNaN(workTime) || workTime < 1 || workTime > 999) {
        alert('運動時間は1〜999の間で入力してください');
        return false;
    }
    
    if (isNaN(restTime) || restTime < 1 || restTime > 999) {
        alert('休憩時間は1〜999の間で入力してください');
        return false;
    }
    
    if (isNaN(totalSets) || totalSets < 1 || totalSets > 99) {
        alert('セット数は1〜99の間で入力してください');
        return false;
    }
    
    return { 
        workTime, 
        restTime, 
        totalSets,
        audioEnabled: elements.audioEnabled.checked,
        volume: elements.volumeSlider.value / 100
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
    
    // タイマーをリセット
    timer.state = TimerState.IDLE;
    timer.currentSet = 1;
    timer.currentTime = timer.settings.workTime;
    
    // 表示を更新
    updateDisplay();
    updateTimerStyle();
    
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

// イベントリスナーの設定
elements.startBtn.addEventListener('click', startTimer);
elements.stopBtn.addEventListener('click', stopTimer);
elements.resetBtn.addEventListener('click', resetTimer);
elements.applySettingsBtn.addEventListener('click', applySettings);

// 入力フィールドのリアルタイムバリデーション
elements.workTimeInput.addEventListener('input', (e) => {
    if (e.target.value < 1) e.target.value = 1;
    if (e.target.value > 999) e.target.value = 999;
});

elements.restTimeInput.addEventListener('input', (e) => {
    if (e.target.value < 1) e.target.value = 1;
    if (e.target.value > 999) e.target.value = 999;
});

elements.setCountInput.addEventListener('input', (e) => {
    if (e.target.value < 1) e.target.value = 1;
    if (e.target.value > 99) e.target.value = 99;
});

// 音量スライダーの更新
elements.volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value;
    elements.volumeDisplay.textContent = volume + '%';
});

// 初期化
updateDisplay();
updateTimerStyle();