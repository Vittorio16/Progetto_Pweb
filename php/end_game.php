<?php
require_once "dbaccess.php";
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
            
            if (!$_SESSION["game_id"]){
                echo json_encode(["status" => "error","message"=> "Game not in progress"]);
                exit();
            }
            $falsi = false;
            if ($falsi){
                // TODO: security checks and check logged in
                echo json_encode([
                    "status" => "error",
                    "message" => "Better luck next time",
                ]);
                exit();
            }

            $query = $conn->prepare("INSERT INTO user_scores (user_id, score) VALUES (?, ?)");
            $query->bind_param("ii", $_SESSION["user_id"], $score);
            $query->execute();

            $query = $conn->prepare("SELECT game_id, user_id, score, started_at, ended_at FROM user_scores WHERE user_id=?");
            $query->bind_param("i", $_SESSION["user_id"]);
            $query->execute();

            $result = $query->get_result();

            // If there is a result, check to see which score is best
            $high_score = 0;
            $num_rows = 0;

            while($row = $result->fetch_assoc()) {

                if ($row["score"] >= $high_score) {
                    $high_score = $row["score"];
                }
            }

            $_SESSION["high_score"] = $high_score;
            $_SESSION["game_in_progress"] = false;
            $_SESSION["game_id"] = null;

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