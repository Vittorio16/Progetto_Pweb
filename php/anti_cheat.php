<?php
require_once "dbaccess.php";
session_start();


// Called at the end of each game to check for cheating
function check_cheating($conn, $score, $gameData){
    $query = $conn->prepare("SELECT user_id, event_type, occured_at FROM game_events WHERE game_id = ? ORDER BY occured_at");
    $query->bind_param("i", $_SESSION["game_id"]);
    $query->execute();

    $result = $query->get_result();

    $server_game_data = [];
    while ($row = $result->fetch_assoc()) {
        $server_game_data[] = $row;
    }

    $max_possible_score = 0;
    $enemies_killed = 0;
    $lives_lost = 0;

    $bullets_fired = 0;
    $previous_bullet = INF;
    $min_reload_time = INF;

    // If, for any entry, user id is not the same for any reason, flag
    foreach ($server_game_data as $entry){
        if ($entry["user_id"] != $_SESSION["user_id"]) {
            return true;
        }
        // More than only killing top enemies
        if ($entry["event_type"] === "ENEMY_KILL"){
            $max_possible_score += 40;
            $enemies_killed++;
        }

        if ($entry["event_type"] === "PLAYER_HIT"){
            $lives_lost++;
        }

        // Checks time difference in milliseconds
        if ($entry["event_type"] === "BULLET_FIRED"){
            $bullets_fired++;

            if ($previous_bullet != INF){
                $new_bullet = new DateTime($entry["occured_at"]);
                $new_bullet = (float) $new_bullet->format("U.u");

                $time_difference = ($new_bullet - $previous_bullet) * 1000;

                if ($time_difference < $min_reload_time){
                    $min_reload_time = $time_difference;
                }
            }
            $previous_bullet = new DateTime($entry["occured_at"]);
            $previous_bullet = (float) $previous_bullet->format("U.u");
        }
    }


    // Game duration doesn't match closely
    $startTime = new DateTime($server_game_data[0]["occured_at"]);
    $endTime = new DateTime($server_game_data[count($server_game_data) - 1]["occured_at"]);

    $interval = $endTime->diff($startTime);
    $game_time = ($interval->days * 24 * 60 * 60) +
                    ($interval->h * 60 * 60) +
                    ($interval->i * 60) +
                    $interval->s;;

    if (abs($game_time - $gameData["time_elapsed"]) > 5){
        error_log("different game time");
        return true;
    }

    // if game score can't possibly be consistent with server score, flag (for score > 500 in case only fast ufos are killed, cheating for low scores not important)
    if ($score > $max_possible_score && $score > 600){
        error_log("impossible high score");
        return true;
    }

    // User cheated the gameData and set more enemies killed 
    if ($enemies_killed != $gameData["enemies_killed"]){
        error_log("different enemies killed");
        return true;
    }

    // Cheating detected in the score being greater than the max score possibly spawned
    if ($score > $gameData["enemy_score_spawned"]){
        error_log("too few enemies");
        return true;
    }

    // Checks for infinite lives cheating
    if ($lives_lost > 3){
        error_log("too many lives");
        return true;
    }

    // Firing inconsistencies (reload time < 80ms)
    if ($bullets_fired != $gameData["bullets_shot"] || $min_reload_time < 25 || $game_time / $bullets_fired < 0.08){
        error_log("bullet inconsistency");
        return true;
    }

    // Tries to check for enemy slow downs
    if ($gameData["enemy_displacement"] < $game_time * 50 / 50){
        error_log("help me i'm stuck");
        return true;
    }
    // No cheating detected
    return false;
}
?>