export class GameState {
    constructor(canvas_width, canvas_height){
        this.player = {x: canvas_width / 2 - 16, y: canvas_height - 52, width: 32, height: 32, speed: 200, direction: 0};

        this.enemies = []; 
        this.enemy_position = {moving: false, direction: 1, next_dir: -1, current_displacement: 0, max_x: 0, min_x: 50, max_y: 0, speed: 50};

        this.bullets = [];
        this.score = 0;
        this.shields = [];

        this.max_x = canvas_width;
        this.max_y = canvas_height;
        
        // Populate the enemies array
        this.add_enemies(canvas_width, canvas_height);
    }

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


    // Updates the player and enemies every game loop
    update(delta_seconds){
        this.movePlayer(delta_seconds);

        console.log(this.enemy_position.moving);
        // Decides where to move enemies
        if (this.enemy_position.moving){
            if (this.enemy_position.direction === 1 || this.enemy_position.direction === -1){
                this.move_enemies_horizontal(delta_seconds);

            } else if (this.enemy_position.direction === 0){
                this.move_enemies_vertical(delta_seconds);
            }
        }
    }
}