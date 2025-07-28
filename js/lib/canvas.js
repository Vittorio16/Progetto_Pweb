import { GameState } from './gameState.js';

export class GameCanvas {
    constructor(canvasElement){
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext("2d");

        this.lastTime = 0;
        this.keys = {};
        this.enemy_move_interval = null;

        this.listenKeydown = (e) => { this.keys[e.code] = true;};
        this.listenKeyup = (e) => { this.keys[e.code] = false;};

        this.imagesLoaded = 0;

        const width = document.getElementById("game-canvas").width;
        const height = document.getElementById("game-canvas").height;

        this.width = width;
        this.height = height;

        this.gameState = new GameState(width, height);

        this.top_enemy_img = new Image();
        this.top_enemy_img.src = "../js/lib/images/top_enemy.png";
        this.top_enemy_img.onload = () => this.checkAllImagesLoaded();

        this.mid_enemy_img = new Image();
        this.mid_enemy_img.src = "../js/lib/images/mid_enemy.png";
        this.mid_enemy_img.onload = () => this.checkAllImagesLoaded();

        this.bot_enemy_img = new Image();
        this.bot_enemy_img.src = "../js/lib/images/bot_enemy.png";
        this.bot_enemy_img.onload = () => this.checkAllImagesLoaded();

        this.player_img = new Image();
        this.player_img.src = "../js/lib/images/player_ship.png";
        this.player_img.onload = () => this.checkAllImagesLoaded();

    }


    startGame(){
        document.getElementById("start-game").disabled = true;
        this.timestamp = 0;
        
        window.addEventListener("keydown", this.listenKeydown);
        window.addEventListener("keyup", this.listenKeyup);


        this.enemy_movement_loop();

        requestAnimationFrame(this.gameLoop.bind(this));
    }


    endGame(){
        window.removeEventListener("keydown", this.listenKeydown);
        window.removeEventListener("keyup", this.listenKeyup);

        clearInterval(this.enemy_move_interval);
        //TODO
    }


    // Makes sure all pngs are loaded before trying to draw the board
    checkAllImagesLoaded(){
        this.imagesLoaded++;
        if (this.imagesLoaded === 4){
            this.drawGame();
        }
    }

    drawGame(){
        this.ctx.clearRect(0, 0, this.width, this.height);

        const player = this.gameState.player;

        // Draws the player
        if (this.player_img.complete) {
            this.ctx.drawImage(this.player_img, player.x, player.y, 32, 32);
        } else {
            console.log("Couldn't load player");
            return;
        }

        // Draws the enemies
        if (this.top_enemy_img.complete && this.mid_enemy_img.complete && this.bot_enemy_img.complete){
            for (let i = 0; i < this.gameState.enemies.length; i++){
                const current_enemy = this.gameState.enemies[i];
                let current_img;

                if (current_enemy.score === 30){
                    current_img = this.top_enemy_img;
                } else if (current_enemy.score === 20){
                    current_img = this.mid_enemy_img;
                } else if (current_enemy.score === 10){
                    current_img = this.bot_enemy_img;
                }

                this.ctx.drawImage(current_img, current_enemy.x, current_enemy.y, 32, 32);
            }
        } else {
            console.log("Couldn't load enemies");
            return;
        }

        for (let i = 0; i < this.gameState.bullets.length; i++){
            this.ctx.beginPath();
            this.ctx.moveTo(this.gameState.bullets[i].x,  this.gameState.bullets[i].y);    
            if (this.gameState.bullets[i].friendly){
                this.ctx.lineTo(this.gameState.bullets[i].x, this.gameState.bullets[i].y + 10);   
            } else {
                this.ctx.lineTo(this.gameState.bullets[i].x, this.gameState.bullets[i].y - 10);   
            }
            this.ctx.strokeStyle = 'red'; 
            this.ctx.lineWidth = 2;       
            this.ctx.stroke();
        }
    }


    // Tells the gameState where to move the player
    updatePlayerInput(){
        let dx = 0;
        if (this.keys["ArrowLeft"]) {
            dx -= 1;
        }
        if (this.keys["ArrowRight"]){
            dx += 1;
        }

        if (this.keys["Space"]){
            this.gameState.player.shooting = true;
        } else {
            this.gameState.player.shooting = false;
        }

        this.gameState.player.direction = dx;
    }


    // Tells weather enemies are moving or not
    enemy_movement_loop(){
        this.enemy_move_interval = setInterval(() => {
            if (this.gameState.enemy_position.moving === true){
                this.gameState.enemy_position.moving = false;
            } else {
                this.gameState.enemy_position.moving = true;
            }
        }, 500);
    }


    gameLoop(timestamp){
        if (!this.lastTime) this.lastTime = timestamp;
        const delta_seconds = (timestamp - this.lastTime) / 1000;


        // Updates enemies, collisions, player positions and shields
        this.updatePlayerInput();
        this.gameState.update(delta_seconds);

        this.drawGame();

        this.lastTime = timestamp;
        if (!this.gameState.gameOver){
            requestAnimationFrame(this.gameLoop.bind(this));
        } else {
            this.endGame();
        }
    }
}