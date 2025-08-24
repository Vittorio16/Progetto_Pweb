import { authContext } from './globals.js';

function toggleSidebar(){
    document.getElementById("sidebar").classList.toggle("hidden");
}

window.toggleSidebar = toggleSidebar;
window.addEventListener("DOMContentLoaded", authContext.handle_check_logged_in);

// Adds event listener for toggling on history sorting
document.getElementById("sort-select").addEventListener("change", authContext.handleViewHistory);