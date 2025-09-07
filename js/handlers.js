import { authContext } from './globals.js';

function toggleSidebar(){
    document.getElementById("sidebar").classList.toggle("hidden");
}

function resizeGameCanvas() {
    const canvas = document.getElementById("game-canvas");
    if (!canvas) return;

    const viewportHeight = window.innerHeight;
    const maxHeight = viewportHeight * 0.6;
    const height = maxHeight;

    canvas.style.height = `${height}px`;
}


function initializeHandlers() {
    authContext.handle_check_logged_in()

    window.toggleSidebar = toggleSidebar;
    // Adds event listener for toggling on history sorting
    document.getElementById("sort-select").addEventListener("change", authContext.handleViewHistory);

    window.addEventListener("resize", resizeGameCanvas);
    window.addEventListener("load", resizeGameCanvas); 
}

window.addEventListener("DOMContentLoaded", initializeHandlers);