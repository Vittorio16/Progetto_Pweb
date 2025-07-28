export class GameState {
    constructor(canvas_width, canvas_height){
        this.player = {x: canvas_width / 2 - 16, y: canvas_height - 52, width: 32, height: 32, speed: 200, direction: 0, shooting: false, reloading: false};

        this.enemies = []; 
        this.enemy_position = {moving: false, direction: 1, next_dir: -1, current_displacement: 0, max_x: 0, min_x: 50, max_y: 0, speed: 50};

        this.bullets = [];
        this.bullet_speed = {friendly: 400, enemy: 100};

        this.score = 0;
        this.shields = [];

        this.max_x = canvas_width;
        this.max_y = canvas_height;
        
        // Populate the enemies array
        this.add_enemies(canvas_width, canvas_height);
    }


    // Creates enemies
    add_enemies(canvas_width, canvas_height){
        const num_horizontal_enemies = 11;
        const num_rows = 5;
        let current_x = 50;
        let current_y = 100;

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
                this.enemies.push({x: current_x, y: current_y, width: 32, height: 32, score: s});

                if (current_x > this.enemy_position.max_x) {
                    this.enemy_position.max_x = current_x;
                }
                current_x += (canvas_width - 500) / num_horizontal_enemies;
            }

            if (current_y > this.enemy_position.max_y){
                this.enemy_position.max_y = current_y;
            }

            current_x = 50;
            current_y += (canvas_height - 320) / num_rows;
        }
    }


    // Generates player and enemy bullets
    add_bullet(player_bullet, x_origin = this.player.x, y_origin = this.player.y){
        if (player_bullet){
            this.bullets.push({x: x_origin + 16, y: y_origin - 10, friendly: player_bullet});
        } else {
            this.bullets.push({x: x_origin + 16, y: y_origin + 42, friendly: player_bullet});
        }
    }


    // For each enemy, small probability of firing a bullet
    generate_enemy_bullets(){
        for (let i = 0; i < this.enemies.length; i++){
            const shouldFire = Math.random() < 0.0003;
            console.log(this.enemies[i].x);
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

            setTimeout(() => {
                this.player.reloading = false;
            }, 500);
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
        console.log(this.enemy_position.current_displacement);

        this.enemy_position.current_displacement += delta_y;
        this.enemy_position.max_y += delta_y;

        for (let i = 0; i < this.enemies.length; i++){
            this.enemies[i].y += delta_y;
        }
    }


    // Tries to move enemies horizontally if possible
    move_enemies_horizontal(delta_seconds){
        const delta_x = this.enemy_position.direction * this.enemy_position.speed * delta_seconds;

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


    // Moves enemy bullets down and player bullets up
    move_bullets(delta_seconds){
        for (let i = 0; i < this.bullets.length; i++){
            if (this.bullets[i].friendly){
                this.bullets[i].y -= this.bullet_speed.friendly * delta_seconds;
            } else {
                this.bullets[i].y += this.bullet_speed.enemy * delta_seconds;
            }
        }
    }
    // Updates the player and enemies every game loop
    update(delta_seconds){
        this.generate_enemy_bullets();

        this.movePlayer(delta_seconds);

        // Decides where to move enemies
        if (this.enemy_position.moving){
            if (this.enemy_position.direction === 1 || this.enemy_position.direction === -1){
                this.move_enemies_horizontal(delta_seconds);

            } else if (this.enemy_position.direction === 0){
                this.move_enemies_vertical(delta_seconds);
            }
        }

        this.move_bullets(delta_seconds)
    }
}