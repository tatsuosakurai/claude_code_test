document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('clickButton');
    const messageDiv = document.getElementById('message');
    let clickCount = 0;

    const messages = [
        { text: 'ボタンがクリックされました！', class: 'success' },
        { text: '素晴らしい！もう一度クリックしてみてください。', class: 'info' },
        { text: 'クリックのプロです！', class: 'success' },
        { text: 'JavaScriptが動作しています！', class: 'info' }
    ];

    button.addEventListener('click', function() {
        clickCount++;
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        messageDiv.textContent = `${randomMessage.text} (クリック回数: ${clickCount})`;
        messageDiv.className = `message show ${randomMessage.class}`;
        
        setTimeout(() => {
            messageDiv.classList.remove('show');
        }, 3000);
    });

    button.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
    });

    button.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});