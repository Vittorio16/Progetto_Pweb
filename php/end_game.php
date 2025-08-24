<?php
require_once "dbaccess.php";
require_once "anti_cheat.php";
session_start();

$conn =  mysqli_connect(DBHOST, DBUSER, DBPASS,  DBNAME);

if ($conn->connect_error) {
    die("DB connection failed: ". mysqli_connect_error());
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, true);

    $score = $input['score'];
    $gameData = $input['gameData'];

    if (isset($_SESSION['user_id'], $_SESSION['token'], $_COOKIE['session_token'])) {
        if (hash_equals($_SESSION['token'], $_COOKIE['session_token'])) {
            

            if (!$_SESSION["game_in_progress"] || $_SESSION["game_id"] == null){
                echo json_encode(["status" => "error","message"=> "Game not in progress"]);
                exit();
            }

            // Cross checks game data sent at game over and game data saved in db to check for cheating
            $cheated = check_cheating($conn, $score, $gameData);

            if ($cheated){
                echo json_encode([
                    "status"=> "error",
                    "message"=> "Better luck next time",
                ]);
                exit();
            }

            // Inserts the game into the games db
            $query = $conn->prepare("INSERT INTO user_scores (user_id, score, bullets_shot, enemies_killed, waves_cleared) VALUES (?,?,?,?,?)");
            $query->bind_param("iiiii", $_SESSION["user_id"], $score, $gameData["bullets_shot"], 
                                $gameData["enemies_killed"], $gameData["waves_cleared"]);
            $query->execute();

            $query = $conn->prepare("SELECT MAX(score) as score FROM user_scores WHERE user_id=?");
            $query->bind_param("i", $_SESSION["user_id"]);
            $query->execute();

            $result = $query->get_result();
            $row = $result->fetch_assoc();
            // check to see which score is best
            $high_score = $row["score"];
            
            // Updates the global scoreboard if necessary
            $query = $conn->prepare("SELECT COUNT(*) AS count FROM top_scores");
            $query->execute();

            $result = $query->get_result();
            $row = $result->fetch_assoc();

            // If < 20 scores, adds it to the top scores or 
            $insert = false;
            if ($row["count"] < 20) {
                $insert = true;
            } else {
                $query = $conn->prepare("SELECT game_id, score FROM top_scores ORDER BY score ASC, ended_at DESC LIMIT 1");
                $query->execute();

                $result = $query->get_result();
                $lowest = $result->fetch_assoc();

                if ($score > $lowest["score"]){
                    $insert = true;
                    $query = $conn->prepare("DELETE FROM top_scores WHERE game_id=?");
                    $query->bind_param("i", $lowest["game_id"]);
                    $query->execute();
                }
            }

            if ($insert){
                $query = $conn->prepare("INSERT INTO top_scores (game_id, username, score, bullets_shot, enemies_killed, waves_cleared) VALUES (?,?,?,?,?,?)");
                $query->bind_param("isiiii", $_SESSION["game_id"], $_SESSION["username"], $score,
                                    $gameData["bullets_shot"], $gameData["enemies_killed"], $gameData["waves_cleared"]);
                $query->execute();
            }

            $_SESSION["high_score"] = $high_score;
            $_SESSION["game_id"] = null;
            $_SESSION["game_in_progress"] = false;

            echo json_encode([
                "status"=> "success",
                "message"=> "Updated scores successfully",
                "high_score"=> $high_score,
            ]);
            exit();
        }
    }
}
echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
exit();
?>