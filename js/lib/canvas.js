import { GameState } from './gameState.js';

export class GameCanvas {
    constructor(canvasElement){
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext("2d");

        this.animationFrameId = null;

        this.lastTime = 0;
        this.keys = {};
        this.enemy_move_interval = null;

        this.listenKeydown = (e) => {this.keys[e.code] = true;};
        this.listenKeyup = (e) => {this.keys[e.code] = false;};

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

        this.shield_img = new Image();
        this.shield_img.src = "../js/lib/images/shield.png";
        this.shield_img.onload = () => this.checkAllImagesLoaded();
    }


    // Makes sure event listeners and interval are cleared on game reset
    resetGame(){
        window.removeEventListener("keydown", this.listenKeydown);
        window.removeEventListener("keyup", this.listenKeyup);

        this.gameState = null;

        clearInterval(this.enemy_move_interval);

        if (this.animationFrameId){
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }


    // If game is active, it restarts it; otherwise it simply starts a new game
    toggleGame(){
        this.resetGame();
        document.getElementById("start-game").textContent = "Restart";
        document.getElementById("start-game").blur();

        this.gameState = new GameState(this.width, this.height);
        this.timestamp = 0;

        window.addEventListener("keydown", this.listenKeydown);
        window.addEventListener("keyup", this.listenKeyup);


        this.enemy_movement_loop();

        this.animationFrameId =  requestAnimationFrame(this.gameLoop.bind(this));
    }


    // Displays GAME OVER data
    endGame(){
        document.getElementById("start-game").textContent = "Play a New Game";
        
        this.ctx.fillStyle = "#00ffcc";
        this.ctx.font = "bold 70px 'Segoe UI', sans-serif";
        this.ctx.textAlign = "center";
        
        this.ctx.fillText("GAME OVER", this.width / 2, this.height / 2);
        
        this.ctx.font = "bold 40px 'Segoe UI', sans-serif";
        if (this.sendScore()){
            this.ctx.fillText(`Final Score: ${this.gameState.score}`, this.width / 2, this.height / 2 + 100);
        } else {
            this.ctx.fillText(`An issue occured while uploading the score to the db`, this.width / 2, this.height / 2 + 100);
        }

        this.resetGame();
    }


    // Sends score to the server and returns false only if an error occured uploading it or if it was found suspicious
    async sendScore(){
        const score = this.gameState.score;
        const gameData = this.gameState.gameData;

        const payload = {score, gameData};

        try {
            const res = await fetch("../php/save_score.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const resData = await res.json();
            if (resData.status === "success"){

                // If new personal best set, update best score without having to reload the page
                if (resData.new_best){
                    document.getElementById("high_score_h").textContent = "High Score: " + score;
                }

                return true;
            } else {
                alert("An unexpected error occured");
                return false; 
            }
        } catch (error){
            console.log(error);
            alert("An unexpected error occured");
            return false;
        }
    }


    // Makes sure all pngs are loaded before trying to draw the board
    checkAllImagesLoaded(){
        this.imagesLoaded++;
        if (this.imagesLoaded === 5){
            this.drawGame();
        }
    }

    drawGame(){
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = "#00ffcc";
        this.ctx.font = "bold 30px 'Segoe UI', sans-serif";

        this.ctx.textAlign = "left";
        this.ctx.fillText(`Lives: ${this.gameState.lives}`, 20, 40);

        this.ctx.textAlign = "center";
        this.ctx.fillText(`Score: ${this.gameState.score}`, this.width/2, 40);

        const player = this.gameState.player;

        // Draws the player, flickering if just hit
        if (this.player_img.complete && (this.gameState.pauseTimer <= 0 || Math.floor(this.gameState.pauseTimer * 10) % 2 === 0)) {
            this.ctx.drawImage(this.player_img, player.x, player.y, 32, 32);
        }

        // Draws the shields
        const shields = this.gameState.shields;
        if (this.shield_img.complete){
            for (let i = 0; i < shields.length; i++){
                this.ctx.drawImage(this.shield_img, shields[i].x, shields[i].y, 64, 64);

                this.ctx.font = "10px sans-serif";
                this.ctx.textAlign = "center";
                this.ctx.fillText(this.gameState.shields[i].lives, shields[i].x + 32, shields[i].y + 16);
            }
        } else {
            console.log("Couldn't load shields");
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