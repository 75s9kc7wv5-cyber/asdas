/**
 * Zoom Prevention Script
 * Disables zoom in/out on all game pages
 * Include this script in all HTML files with <script src="js/zoom-prevention.js"></script>
 */

(function() {
    'use strict';

    // Prevent zoom via keyboard shortcuts (Ctrl/Cmd + +, -, 0)
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Plus (zoom in)
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
            e.preventDefault();
        }
        // Ctrl/Cmd + Minus (zoom out)
        if ((e.ctrlKey || e.metaKey) && e.key === '-') {
            e.preventDefault();
        }
        // Ctrl/Cmd + 0 (reset zoom)
        if ((e.ctrlKey || e.metaKey) && e.key === '0') {
            e.preventDefault();
        }
    });

    // Prevent zoom via mouse wheel (Ctrl/Cmd + Scroll)
    document.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
        }
    }, { passive: false });

    // Prevent pinch-to-zoom on touch devices
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // Disable double-tap zoom on touch devices (iOS)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
})();
