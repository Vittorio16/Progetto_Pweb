import { authContext } from './globals.js';

function toggleSidebar(){
    document.getElementById("sidebar").classList.toggle("hidden");
}

window.toggleSidebar = toggleSidebar;
window.addEventListener("DOMContentLoaded", authContext.handle_check_logged_in);