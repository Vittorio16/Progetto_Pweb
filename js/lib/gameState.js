export class GameState {
    constructor(canvas_width, canvas_height){
        this.player = {x: canvas_width / 2 - 16, y: canvas_height - 52, width: 32, height: 32};
        this.enemies = [];
        this.bullets = [];
        this.score = 0;
        this.shields = [];

        this.enemy_box_x = 100;
        this.enemy_box_y = 100;
        
        // Populate the enemies array
        this.add_enemies(canvas_width, canvas_height);
    }

    add_enemies(canvas_width, canvas_height){
        const num_horizontal_enemies = 11;
        const num_rows = 5;
        let current_x = this.enemy_box_x;
        let current_y = this.enemy_box_y;

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

                current_x += (canvas_width - 500) / num_horizontal_enemies;
            }
            current_x = this.enemy_box_x;
            current_y += (canvas_height - 320) / num_rows;
        }
    }
    update(delta_seconds){
        // TODO
    }
}