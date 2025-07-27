export class GameState {
    constructor(){
        this.player = {x: 0, y: 0, width: 32, height: 32};
        this.enemies = [];
        this.bullets = [];
        this.score = 0;
        this.shields = [];
    }

    update(delta_seconds){
        // TODO
    }
}