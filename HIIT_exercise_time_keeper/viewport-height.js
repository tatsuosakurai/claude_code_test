// iOSのviewport heightの問題を解決
function setViewportHeight() {
    // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
    let vh = window.innerHeight * 0.01;
    // Then we set the value in the --vh custom property to the root of the document
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Set the viewport height initially
setViewportHeight();

// Re-calculate on resize and orientation change
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);

// Prevent double-tap zoom on iOS
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Prevent pull-to-refresh on iOS
let startY = 0;
document.addEventListener('touchstart', function(e) {
    startY = e.touches[0].pageY;
}, { passive: true });

document.addEventListener('touchmove', function(e) {
    const y = e.touches[0].pageY;
    // Prevent pull-to-refresh if scrolling down from the top
    if (document.documentElement.scrollTop === 0 && y > startY) {
        e.preventDefault();
    }
}, { passive: false });
