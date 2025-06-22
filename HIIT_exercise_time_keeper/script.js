// タイマーの状態を管理
const TimerState = {
    IDLE: 'idle',
    PREPARE: 'prepare',
    WORK: 'work',
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
        prepareTime: 10,
        totalSets: 9,
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
    currentSet: document.getElementById('currentSet'),
    totalSets: document.getElementById('totalSets'),
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    resetBtn: document.getElementById('resetBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    timerDisplay: document.querySelector('.timer-display'),
    nextAction: document.getElementById('nextAction'),
    // 設定関連の要素
    workTimeInput: document.getElementById('workTimeInput'),
    prepareTimeInput: document.getElementById('prepareTimeInput'),
    setCountInput: document.getElementById('setCountInput'),
    applySettingsBtn: document.getElementById('applySettingsBtn'),
    // 進捗表示関連の要素
    overallProgress: document.getElementById('overallProgress'),
    overallProgressText: document.getElementById('overallProgressText'),
    totalElapsedTime: document.getElementById('totalElapsedTime')
};

// 初期表示の更新
function updateDisplay() {
    elements.timeDisplay.textContent = timer.currentTime;
    elements.currentSet.textContent = timer.currentSet;
    elements.totalSets.textContent = timer.settings.totalSets;
    
    // 設定入力フィールドの値を更新
    elements.workTimeInput.value = timer.settings.workTime;
    elements.prepareTimeInput.value = timer.settings.prepareTime;
    elements.setCountInput.value = timer.settings.totalSets;
    
    // 進捗表示の更新
    updateProgressDisplay();
}

// タイマーの状態に応じた表示の更新
function updateTimerStyle() {
    elements.timerDisplay.classList.remove('work', 'rest');
    elements.nextAction.textContent = '';
    
    switch (timer.state) {
        case TimerState.PREPARE:
            elements.status.textContent = '準備時間';
            elements.nextAction.textContent = '準備してください';
            break;
        case TimerState.WORK:
            elements.timerDisplay.classList.add('work');
            elements.status.textContent = '運動中';
            if (timer.currentSet < timer.settings.totalSets) {
                elements.nextAction.textContent = `次：セット ${timer.currentSet + 1}`;
            } else {
                elements.nextAction.textContent = '次：完了！';
            }
            // 運動開始音を再生
            audioSystem.playWorkStart();
            break;
        case TimerState.IDLE:
            elements.status.textContent = '準備時間';
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

// 進捗表示を更新
function updateProgressDisplay() {
    // 全体進捗
    const completedSets = timer.state === TimerState.FINISHED ? timer.settings.totalSets :
        timer.state === TimerState.PREPARE ? 0 : timer.currentSet - 1;
    
    const currentSetProgress = timer.state === TimerState.WORK ? 
        (timer.settings.workTime - timer.currentTime) / timer.settings.workTime : 0;
    
    const overallProgressPercent = ((completedSets + currentSetProgress) / timer.settings.totalSets) * 100;
    
    elements.overallProgress.style.width = overallProgressPercent + '%';
    elements.overallProgressText.textContent = `セット ${completedSets}/${timer.settings.totalSets} 完了`;
    
    // 総経過時間
    if (timer.startTime && timer.interval) {
        timer.totalElapsedTime = Math.floor((Date.now() - timer.startTime) / 1000);
    }
    elements.totalElapsedTime.textContent = formatTime(timer.totalElapsedTime);
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
            elements.currentSet.textContent = timer.currentSet;
            updateTimerStyle();
        } else if (timer.state === TimerState.WORK) {
            // 次のセットへ
            timer.currentSet++;
            
            if (timer.currentSet > timer.settings.totalSets) {
                // 全セット完了
                finishTimer();
            } else {
                // 次のセットの運動へ（休憩なし）
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
    const totalSets = parseInt(elements.setCountInput.value);
    
    // 値の検証
    if (isNaN(workTime) || workTime < 1 || workTime > 999) {
        alert('運動時間は1〜999の間で入力してください');
        return false;
    }
    
    if (isNaN(prepareTime) || prepareTime < 1 || prepareTime > 999) {
        alert('準備時間は1〜999の間で入力してください');
        return false;
    }
    
    if (isNaN(totalSets) || totalSets < 1 || totalSets > 99) {
        alert('セット数は1〜99の間で入力してください');
        return false;
    }
    
    return { 
        workTime, 
        prepareTime, 
        totalSets,
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
    
    // タイマーをリセット
    timer.state = TimerState.IDLE;
    timer.currentSet = 1;
    timer.currentTime = timer.settings.prepareTime;
    timer.startTime = null;
    timer.totalElapsedTime = 0;
    
    // 表示を更新
    updateDisplay();
    updateTimerStyle();
    
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

// イベントリスナーの設定
elements.startBtn.addEventListener('click', startTimer);
elements.stopBtn.addEventListener('click', stopTimer);
elements.resetBtn.addEventListener('click', resetTimer);
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

elements.setCountInput.addEventListener('input', (e) => {
    if (e.target.value < 1) e.target.value = 1;
    if (e.target.value > 99) e.target.value = 99;
});


// 初期化
updateDisplay();
updateTimerStyle();