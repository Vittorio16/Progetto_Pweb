import { GameState } from './gameState.js';

export class GameCanvas {
    constructor(canvasElement){
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext("2d");
        this.lastTime = 0;

        this.gameState = new GameState();
        this.drawGame();
    }

    play(){
        // TODO
    }

    drawGame(){
        const player_img = new Image();
        player_img.src = "../js/lib/images/player_ship.png";

        player_img.onload = () => {
            this.ctx.drawImage(player_img, 100, 100, 32, 32);
        }
    }

    gameLoop(timestamp){
        if (!this.lastTime) this.lastTime = timestamp;
        const delta_seconds = (timestamp - this.lastTime) / 1000;


        this.gameState.update(delta_seconds);
        this.drawGame();

        this.lastTime = timestamp;
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}