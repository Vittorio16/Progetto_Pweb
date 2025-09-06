import { UserHomePage } from './context/userHomePage.js';
import { AuthContext } from './context/authContext.js';
import { ApiContext } from './context/apiContext.js';
import { GameCanvas } from './lib/canvas.js';

export const userHomePage = new UserHomePage();
export const authContext = new AuthContext();
export const apiContext = new ApiContext();

document.addEventListener('DOMContentLoaded', () => {
    const canvasElement = document.getElementById('game-canvas');

    if (canvasElement){
        const gameCanvas = new GameCanvas(canvasElement);
        window.gameCanvas = gameCanvas;
    }

    window.userHomePage = userHomePage;
    window.authContext = authContext;
    window.apiContext = apiContext;
});