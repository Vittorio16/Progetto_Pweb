import { GameState } from './gameState.js';

export class GameCanvas {
    constructor(canvasElement){
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext("2d");

        this.gameId = null;
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

        this.imgDict = {ufo_img: "../js/lib/images/ufo.png", top_enemy_img: "../js/lib/images/top_enemy.png", mid_enemy_img: "../js/lib/images/mid_enemy.png",
            bot_enemy_img: "../js/lib/images/bot_enemy.png", player_img: "../js/lib/images/player_ship.png", invulnerable_player_img: "../js/lib/images/invulnerable_player_ship.png",
            shield_img: "../js/lib/images/shield.png", player_bullet_img: "../js/lib/images/player_bullet.png", enemy_bullet_img: "../js/lib/images/enemy_bullet.png",
            x2_img: "../js/lib/images/power_up_2x.png", rf_img: "../js/lib/images/power_up_rf.png", inv_img: "../js/lib/images/power_up_inv.png"
        }

        this.createImgVariables();

        document.getElementById("logout-button").addEventListener("click",() => this.quitGame);
    }


    // Quits the game when button pressed and on logout
    quitGame(){
        this.resetGame();

        document.getElementById("start-game").textContent = "Play a New Game";
        document.getElementById("quit-game").classList.add("hidden");

        this.gameState = new GameState(this.width, this.height);

        this.timestamp = 0;
        this.drawGame();
    }


    // Makes sure event listeners and interval are cleared on game reset
    resetGame(){
        window.removeEventListener("keydown", this.listenKeydown);
        window.removeEventListener("keyup", this.listenKeyup);

        this.gameState = null;
        this.keys = {};
        this.lastTime = 0;

        clearInterval(this.enemy_move_interval);

        if (this.animationFrameId){
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

    }
    
    
    // If game is active, it restarts it; otherwise it simply starts a new game
    async toggleGame(){
        this.resetGame();
        this.gameState = new GameState(this.width, this.height);
        document.getElementById("sidebar").classList.add("hidden");

        // Tells the server to start a new game (only possible if the user doesn't have other games active)
        try {
            const res = await fetch("../php/start_game.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const resData = await res.json();
            if (resData.status === "success"){
                // If game added to db succesfully, save the game id
                this.gameState.gameId = resData.game_id;

            } else {
                alert("An unexpected error occured while starting the game");
            }
        } catch (error){
            alert("An unexpected error occured while starting the game");
        }

        document.getElementById("start-game").textContent = "Restart";
        document.getElementById("start-game").blur();
        document.getElementById("quit-game").classList.remove("hidden");

        this.timestamp = 0;

        window.addEventListener("keydown", this.listenKeydown);
        window.addEventListener("keyup", this.listenKeyup);

        this.enemy_movement_loop();

        this.animationFrameId =  requestAnimationFrame(this.gameLoop.bind(this));
    }


    // Displays GAME OVER data
    endGame(){
        document.getElementById("start-game").textContent = "Play a New Game";
        document.getElementById("quit-game").classList.add("hidden");

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
            const res = await fetch("../php/end_game.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const resData = await res.json();
            if (resData.status === "success"){
                // If new personal best set, update best score without having to reload the page
                document.getElementById("high_score_h").textContent = "High Score: " + resData.high_score;

                return true;
            } else {
                alert("message: " + resData.message);
                alert("An unexpected error occured");
                return false; 
            }
        } catch (error){
            alert("An unexpected error occured");
            return false;
        }
    }


    createImgVariables(){
        for (let var_name in this.imgDict){
            this[var_name] = new Image();
            this[var_name].src = this.imgDict[var_name];
            this[var_name].onload = () => this.checkAllImagesLoaded();
        }
    }

    // Makes sure all pngs are loaded before trying to draw the board
    checkAllImagesLoaded(){

        this.imagesLoaded++;
        if (this.imagesLoaded === Object.keys(this.imgDict).length){
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

        // Draws the player, flickering if just hit, and accounting for invulnerability power up, flickering when ending
        if (this.player_img.complete && this.invulnerable_player_img.complete && 
            (this.gameState.pauseTimer <= 0 || Math.floor(this.gameState.pauseTimer * 10) % 2 === 0)) {

            if (this.gameState.player.power_ups["invulnerability"] > 2){
                this.ctx.drawImage(this.invulnerable_player_img, player.x, player.y, 32, 32);

            } else if (this.gameState.player.power_ups["invulnerability"] > 0){
                const flickerOn = Math.floor(Date.now() / 250) % 2 === 0;
                if (flickerOn) {
                    this.ctx.drawImage(this.player_img, player.x, player.y, 32, 32);
                } else {
                    this.ctx.drawImage(this.invulnerable_player_img, player.x, player.y, 32, 32);
                }
            } else {
                this.ctx.drawImage(this.player_img, player.x, player.y, 32, 32);
            }
        }

        // New wave pop up
        if (this.gameState.new_wave){
            this.ctx.fillStyle = "#00ffcc";
            this.ctx.font = "bold 70px 'Segoe UI', sans-serif";
            this.ctx.textAlign = "center";
            
            this.ctx.fillText(`WAVE ${this.gameState.gameData.waves_cleared + 1}`, this.width / 2, this.height / 2);
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

                this.ctx.drawImage(current_img, current_enemy.x, current_enemy.y, 30, 30);
            }
        } else {
            console.log("Couldn't load enemies");
        }


        // Draws the ufo, if present
        if (this.ufo_img.complete && this.gameState.ufo.present){
            const ufo = this.gameState.ufo;
            this.ctx.drawImage(this.ufo_img, ufo.x, ufo.y, 32, 32);
        }


        // Draws the bullets
        if (this.player_bullet_img.complete && this.enemy_bullet_img.complete){
            for (let i = 0; i < this.gameState.bullets.length; i++){
                if (this.gameState.bullets[i].friendly){
                    this.ctx.drawImage(this.player_bullet_img, this.gameState.bullets[i].x - 3, this.gameState.bullets[i].y, 6, 12);
                } else {
                    this.ctx.drawImage(this.enemy_bullet_img, this.gameState.bullets[i].x - 3, this.gameState.bullets[i].y - 12, 6, 12);
                }
            }
        }

        // Draws the power ups
        if (this.x2_img.complete && this.rf_img.complete && this.inv_img.complete){
            for (let i = 0; i < this.gameState.active_drops.length; i++){
                let current;
    
                if (this.gameState.active_drops[i].type === "2x"){
                    current = this.x2_img;
                } else if (this.gameState.active_drops[i].type === "invulnerability"){
                    current = this.inv_img;
                } else if (this.gameState.active_drops[i].type === "rapid_fire"){
                    current = this.rf_img;
                }

                this.ctx.drawImage(current, this.gameState.active_drops[i].x, this.gameState.active_drops[i].y, 16, 16)
            }
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
            this.animationFrameId =  requestAnimationFrame(this.gameLoop.bind(this));
        } else {
            this.endGame();
        }
    }
}