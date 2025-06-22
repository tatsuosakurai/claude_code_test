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
        totalSets: 8
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
    applySettingsBtn: document.getElementById('applySettingsBtn')
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
            break;
        case TimerState.REST:
            elements.timerDisplay.classList.add('rest');
            elements.status.textContent = '休憩中';
            elements.nextAction.textContent = `次：運動 ${timer.settings.workTime}秒`;
            break;
        case TimerState.IDLE:
            elements.status.textContent = '準備完了';
            elements.nextAction.textContent = 'スタートボタンを押してください';
            break;
        case TimerState.FINISHED:
            elements.status.textContent = '完了！';
            elements.nextAction.textContent = 'お疲れさまでした！';
            break;
    }
}

// カウントダウン処理
function countdown() {
    timer.currentTime--;
    elements.timeDisplay.textContent = timer.currentTime;
    
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
function startTimer() {
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
    
    return { workTime, restTime, totalSets };
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

// 初期化
updateDisplay();
updateTimerStyle();