export class GameState {
    constructor(canvas_width, canvas_height){

        this.gameId = null;
        this.gameOver = false;
        this.paused = false;
        this.pauseTimer = 0;

        this.gameData = {bullets_shot: 0, time_elapsed: 0, enemy_score_spawned: 0, enemies_killed: 0, waves_cleared: 0, enemy_displacement: 0};

        this.player = {x: canvas_width / 2 - 16, y: canvas_height - 52, width: 32, height: 32, speed: 200, direction: 0, 
                        shooting: false, reloading: false, reload_time: 500,
                        power_ups: {}};

        this.ufo = {present: false, x: 0, y: 60, width: 40, height: 20, speed: 0, score: 0, spawn_probability: 0.003};

        this.enemies = []; 
        this.enemy_scaling = {speed_multiplier: 1 /50, projectile_chance: 0.0002, starting_enemy_speed: 50};
        this.enemy_position = {moving: false, direction: 1, next_dir: -1, current_displacement: 0, max_x: 0, min_x: 50, max_y: 0, speed: 50, chance: 0.0002};

        this.bullets = [];
        this.bullet_speed = {friendly: 400, enemy: 100};

        this.score = 0;
        this.lives = 1;

        this.shields = [];

        this.power_up_data = {width: 16, height: 16, speed: 60, type: ["2x", "invulnerability", "rapid_fire"], duration: 15, spawn_probability: 0.03};
        this.active_drops = [];

        this.max_x = canvas_width;
        this.max_y = canvas_height;
        
        // Populate the enemies and shields arrays
        this.add_enemies();
        this.add_shields();
    }


    async update_game_progress(event_type){
        const gameId = this.gameId;
        const payload = {gameId, event_type};

        try {
            await fetch("../php/update_game_progress.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
        } catch (error){
            alert("An unexpected error occured while uploading game data");
        }
    }


    // Spawns the next wave of enemies
    spawn_next_wave(){
        this.gameData.waves_cleared++;

        this.enemy_scaling.starting_enemy_speed += 10;
        this.enemy_scaling.speed_multiplier += this.enemy_scaling.speed_multiplier / 10;
        this.enemy_scaling.projectile_chance = this.enemy_scaling.projectile_chance * 1.5;

        this.enemy_position = {moving: false, direction: 1, next_dir: -1, current_displacement: 0, max_x: 0, min_x: 50, max_y: 0, speed: 50, chance: 0.0002};

        this.add_enemies();

        this.player.x = this.max_x / 2 - 16;
        this.player.y = this.max_y - 52;

        this.paused = true;
        this.pauseTimer = 1;
        this.new_wave = true;

        setTimeout(()=> {
            this.new_wave = false;
        }, 1000);
    }


    // Creates enemies
    add_enemies(){
        const num_horizontal_enemies = 11;
        const num_rows = 5;
        let current_x = 50;
        let current_y = 100;
        
        this.enemy_position.speed = this.enemy_scaling.starting_enemy_speed;
        this.enemy_position.chance = this.enemy_scaling.projectile_chance;

        for (let i = 0; i < num_rows; i++){
            // Sets score depending on which row the enemy is in
            let s;
            
            if (i === 0){
                s = 30;
            } else if (i > 0 && i < 3) {
                s = 20;
            } else if (i >= 3) {
                s = 10;
            }

            for (let j = 0; j < num_horizontal_enemies; j++){
                this.gameData.enemy_score_spawned += s;
                this.enemies.push({x: current_x, y: current_y, width: 32, height: 32, score: s});

                if (current_x > this.enemy_position.max_x) {
                    this.enemy_position.max_x = current_x;
                }
                current_x += (this.max_x - 500) / num_horizontal_enemies;
            }

            if (current_y > this.enemy_position.max_y){
                this.enemy_position.max_y = current_y;
            }

            current_x = 50;
            current_y += (this.max_y - 320) / num_rows;
        }
    }


    // Randomly spawns a ufo, if not already present
    add_ufo(delta_seconds){
        const should_spawn = Math.random() < this.ufo.spawn_probability * delta_seconds * 62;

        if (!this.ufo.present && should_spawn){
            this.ufo.present = true;
            
            this.ufo.speed = Math.round(Math.random() * 400);
            if (this.ufo.speed < 100){
                this.ufo.speed = 100;
            }

            this.ufo.score = Math.round(this.ufo.speed / 5);
            this.gameData.enemy_score_spawned += this.ufo.score;

            this.ufo.x = -40;
        }
    }


    // Randomly spawns power ups at the top of the screen
    add_drop(delta_seconds){
        const should_spawn = Math.random() < this.power_up_data.spawn_probability * delta_seconds * 62;

        if (should_spawn){
            const curr_type = this.power_up_data.type[Math.floor(Math.random() * this.power_up_data.type.length)];
            let curr_x = Math.floor(Math.random() * this.max_x);

            if (curr_x + this.power_up_data.width > this.max_x){
                curr_x = this.max_x - this.power_up_data.width;
            }

            this.active_drops.push({x: curr_x, y: 0, type: curr_type});
        }
    }

    // Each shield is 64x64
    add_shields(){
        for (let i = 0; i < 4; i++){

            const s_x = this.max_x / 8 + i * (this.max_x / 4) - 32;
            const s_y = this.max_y - 126;

            const shield_hitbox = {
                left_rect: {min_x: s_x + 2, max_x: s_x + 18, min_y: s_y + 2, max_y: s_y + 52},
                center_rect: {min_x: s_x + 18,max_x: s_x + 48, min_y: s_y + 2, max_y: s_y + 20},
                right_rect: {min_x: s_x + 48, max_x: s_x + 62, min_y: s_y + 2, max_y: s_y + 52},
            }
            this.shields.push({lives: 30, x: s_x, y: s_y, hitbox: shield_hitbox});
        }
    }


    // Generates player and enemy bullets
    add_bullet(player_bullet, x_origin = this.player.x, y_origin = this.player.y){
        
        if (player_bullet){
            this.update_game_progress("BULLET_FIRED");
            this.gameData.bullets_shot++;

            this.bullets.push({x: x_origin + 16, y: y_origin - 10, friendly: true});
        } else {
            this.bullets.push({x: x_origin + 16, y: y_origin + 42, friendly: false});
        }
    }


    // For each enemy, small probability of firing a bullet
    generate_enemy_bullets(delta_seconds){
        for (let i = 0; i < this.enemies.length; i++){
            // Spawns evenly across frames thanks to delta seconds
            const shouldFire = Math.random() < this.enemy_position.chance * delta_seconds * 62;
            if (shouldFire){
                this.add_bullet(false, this.enemies[i].x, this.enemies[i].y);
            }
        }
    }


    // Moves the player in the direction of the arrow key, if allowed
    movePlayer(delta_seconds){
        const x = this.player.x + this.player.direction * this.player.speed * delta_seconds;
        if (x < 0) {
            this.player.x = 0;
        } else if (x > this.max_x - 32) {
            this.player.x = this.max_x - 32;
        } else{
            this.player.x = x;
        }

        if (this.player.shooting && !this.player.reloading){
            this.add_bullet(true);
            this.player.reloading = true;

            if (this.player.power_ups["rapid_fire"]){
                this.player.reload_time = 200;
            } else {
                this.player.reload_time = 500;
            }
            console.log(this.player.reload_time);
            setTimeout(() => {
                this.player.reloading = false;
            }, this.player.reload_time);
        }
    }


    // Moves the enemies vertically a set amount
    move_enemies_vertical(delta_seconds){
        if (this.enemy_position.current_displacement >= 32){
            const next = this.enemy_position.next_dir * (-1);
            this.enemy_position.direction = this.enemy_position.next_dir;
            this.enemy_position.next_dir = next;

            this.move_enemies_horizontal(delta_seconds);
        }

        const delta_y = this.enemy_position.speed * delta_seconds;

        this.enemy_position.current_displacement += delta_y;
        this.enemy_position.max_y += delta_y;

        for (let i = 0; i < this.enemies.length; i++){
            this.enemies[i].y += delta_y;
        }
    }


    // Tries to move enemies horizontally if possible
    move_enemies_horizontal(delta_seconds){
        const delta_x = this.enemy_position.direction * this.enemy_position.speed * delta_seconds;
        this.gameData.enemy_displacement += delta_x;

        if (this.enemy_position.max_x + delta_x + 32 > this.max_x || this.enemy_position.min_x + delta_x < 0){
            this.enemy_position.current_displacement = 0;
            this.enemy_position.direction = 0;

            this.move_enemies_vertical(delta_seconds);
            return;
        }

        this.enemy_position.max_x += delta_x;
        this.enemy_position.min_x += delta_x;

        for (let i = 0; i < this.enemies.length; i++){
            this.enemies[i].x += delta_x;
        }
    }


    // If present, moves the ufo, until it disappears off the screen
    move_ufo(delta_seconds){
        const delta_x = this.ufo.speed * delta_seconds;
        this.ufo.x += delta_x;

        if (this.ufo.x > this.max_x){
            this.ufo.present = false;
        }
    }


    // Moves the power ups vertically, and deletes them if they are off the screen
    move_drops(delta_seconds){
        const delta_y = this.power_up_data.speed * delta_seconds;

        for (let i = this.active_drops.length - 1; i >= 0; i--){
            if (this.active_drops[i].y + delta_y > this.max_y){
                this.active_drops.splice(i, 1);
            } else {
                this.active_drops[i].y += delta_y;
            }
        }
    }


    // Moves enemy bullets down and player bullets up
    move_bullets(delta_seconds){
        for (let i = this.bullets.length - 1; i >= 0; i--){
            if (this.bullets[i].friendly){
                this.bullets[i].y -= this.bullet_speed.friendly * delta_seconds;
            } else {
                this.bullets[i].y += this.bullet_speed.enemy * delta_seconds;
            }

            if (this.bullets[i].y >= this.max_y || this.bullets[i].y < 0){
                this.bullets.splice(i, 1);
            }
        }
    }


    // Handles collisions with shield hitboxes
    check_shield_hitbox(x, y, hitbox){
        if (x >= hitbox.min_x && x <= hitbox.max_x && y >= hitbox.min_y && y <= hitbox.max_y){
            return true;
        }
        return false;
    }


    // Handles bullet collisions
    check_collisions(){
        let life_lost = false;

        for (let i = this.bullets.length - 1; i >= 0; i--){
            const bullet = this.bullets[i];
            let shield_hit = false;

            // Check collisions with shield
            for (let j = this.shields.length - 1; j >= 0; j--){
                const shield = this.shields[j];

                if (
                    this.check_shield_hitbox(bullet.x, bullet.y, shield.hitbox.left_rect) ||
                    this.check_shield_hitbox(bullet.x, bullet.y, shield.hitbox.center_rect) ||
                    this.check_shield_hitbox(bullet.x, bullet.y, shield.hitbox.right_rect)
                ){
                    this.lose_shield(j);
                    this.bullets.splice(i, 1);
                }
            }

            if (shield_hit) continue;

            // Bullet is friendly, check collisions with enemies and ufo
            if (bullet.friendly){
                let enemy_hit = false;

                for (let j = this.enemies.length - 1; j >= 0; j--){
                    const enemy = this.enemies[j];

                    // enemy hit
                    if (bullet.x >= enemy.x && bullet.x <= enemy.x + 32 && bullet.y >= enemy.y && bullet.y <= enemy.y + 32){
                        this.kill_enemy(j);
                        enemy_hit = true;
                        this.bullets.splice(i, 1);

                        break;
                    }
                }
                if (enemy_hit){
                    continue;
                }
                
                // ufo hit
                if (bullet.x >= this.ufo.x && bullet.x <= this.ufo.x + 40 && bullet.y >= this.ufo.y && bullet.y <= this.ufo.y + 20){
                    this.kill_ufo();
                    this.bullets.splice(i, 1);
                }
            } else {
                // Bullet is enemy, check collisions with player
                if (bullet.x >= this.player.x && bullet.x <= this.player.x + 32 && bullet.y >= this.player.y && bullet.y <= this.player.y + 32 ){
                    this.removeLife();
                    life_lost = true;
                    continue;
                }
            }
        }
        if (life_lost || this.new_wave){
            this.bullets = [];
            this.active_drops = [];
        }
    }


    // Checks if player is collecting a drop
    check_drop_collision(){
        for (let i = this.active_drops.length - 1; i >= 0; i--){
            const drop = this.active_drops[i];
            if (drop.x >= this.player.x && drop.x <= this.player.x + 32 && drop.y >= this.player.y && drop.y <= this.player.y + 32){
                if (this.player.power_ups[drop.type] || this.player.power_ups[drop.type] === 0){
                    this.player.power_ups[drop.type] += this.power_up_data.duration;
                } else {
                    this.player.power_ups[drop.type] = this.power_up_data.duration;
                }
                console.log(this.player.power_ups);
                this.active_drops.splice(i, 1);
            }
        }
    }


    // Checks whether enemies have reached player height
    check_enemies_bottom(){
        if (this.enemy_position.max_y + 32 > this.player.y){
            this.update_game_progress("GAME_END");
            this.gameOver = true;
        }
    }


    // Kills the enemy at an index of the enemies list, then checks for win conditions
    kill_enemy(enemy_index){
        this.gameData.enemies_killed++;
        this.update_game_progress("ENEMY_KILL");

        let kill = this.enemies.splice(enemy_index, 1)[0];
        this.score += kill.score;

        if (this.enemies.length === 0){
            // For now, game over, but then implement multiple rounds
            this.spawn_next_wave();
            return;
        }

        // Updates enemy movement 
        if (kill.x >= this.enemy_position.max_x){
            let new_max = 0;

            for (let i = 0; i < this.enemies.length; i++){
                if (this.enemies[i].x > new_max){
                    new_max = this.enemies[i].x;
                }
            }
            this.enemy_position.max_x = new_max;
        }

        if (kill.x <= this.enemy_position.min_x){
            let new_min = this.enemy_position.max_x;

            for (let i = 0; i < this.enemies.length; i++){
                if (this.enemies[i].x < new_min){
                    new_min = this.enemies[i].x;
                }
            }
            this.enemy_position.min_x = new_min;
        }

        if (kill.y + 32 >= this.enemy_position.max_y){
            let new_max = 0;

            for (let i = 0; i < this.enemies.length; i++){
                if (this.enemies[i].y > new_max){
                    new_max = this.enemies[i].y;
                }
            }
            this.enemy_position.max_y = new_max;
        }

        this.enemy_position.speed += this.enemy_position.speed * this.enemy_scaling.speed_multiplier;
        this.enemy_position.chance += this.enemy_position.chance * 1/30;
    }


    // Destroys the ufo
    kill_ufo(){
        this.gameData.enemies_killed++;
        this.update_game_progress("ENEMY_KILL");

        this.score += this.ufo.score;
        this.ufo.present = false;
    }


    // Makes the shield lose a life
    lose_shield(index){
        this.shields[index].lives--;

        if (this.shields[index].lives === 0){
            this.shields.splice(index, 1);
        }
    }


    // Makes the player lose a life and checks for lose condition
    removeLife(){
        this.lives--;
        this.update_game_progress("PLAYER_HIT");

        if (this.lives === 0){
            this.update_game_progress("GAME_END");
            this.gameOver = true;
            return;
        }

        this.paused = true;
        this.pauseTimer = 1;
    }


    // Updates remaining type on active drops
    update_active_drops(delta_seconds){
        for (let drop of this.power_up_data.type){
            if (this.player.power_ups[drop]){
                this.player.power_ups[drop] -= delta_seconds;

                if (this.player.power_ups[drop] <= 0){
                    delete this.player.power_ups[drop];
                }
            }
        }
    }

    // Updates the player and enemies every game loop
    update(delta_seconds){
        this.gameData.time_elapsed += delta_seconds;

        // When player is hit, small pause
        if (this.paused) {
            this.pauseTimer -= delta_seconds;
            if (this.pauseTimer <= 0) {
                this.paused = false;
            }
            return; 
        }

        this.generate_enemy_bullets(delta_seconds);
        this.add_ufo(delta_seconds);
        this.add_drop(delta_seconds);

        this.movePlayer(delta_seconds);
        this.move_drops(delta_seconds);

        // Decides where to move enemies
        if (this.enemy_position.moving){
            if (this.enemy_position.direction === 1 || this.enemy_position.direction === -1){
                this.move_enemies_horizontal(delta_seconds);

            } else if (this.enemy_position.direction === 0){
                this.move_enemies_vertical(delta_seconds);
            }
        }

        // Moves the ufo, if present
        if (this.ufo.present){
            this.move_ufo(delta_seconds);
        }

        this.move_bullets(delta_seconds);

        this.check_collisions();
        this.check_drop_collision();

        this.update_active_drops(delta_seconds);

        this.check_enemies_bottom();
    }
}