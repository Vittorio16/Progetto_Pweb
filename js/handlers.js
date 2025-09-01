import { authContext } from './globals.js';

function toggleSidebar(){
    document.getElementById("sidebar").classList.toggle("hidden");
}

function initializeHandlers() {
    authContext.handle_check_logged_in()

    window.toggleSidebar = toggleSidebar;

    // Adds event listener for toggling on history sorting
    document.getElementById("sort-select").addEventListener("change", authContext.handleViewHistory);
}

window.addEventListener("DOMContentLoaded", initializeHandlers);