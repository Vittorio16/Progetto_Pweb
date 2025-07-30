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
            $falsi = false;

            if ($falsi){
                // TODO: security checks and check logged in
                echo json_encode([
                    "status" => "error",
                    "message" => "Better luck next time",
                ]);
                exit();
            }

            

            $query = $conn->prepare("SELECT id, user_id, score, achieved_at FROM user_scores WHERE user_id=?");
            $query->bind_param("i", $_SESSION["user_id"]);

            $query->execute();

            $result = $query->get_result();
            $new_best = false;

            // If there is a result, check to see which score is best
            if ($result->num_rows > 0) {
                // TODO - check to see if it's best score, and update everything accordingly
            } else {
                $query = $conn->prepare("INSERT INTO user_scores (user_id, score) VALUES (?, ?)");
                $query->bind_param("ii", $_SESSION["user_id"], $score);

                $query->execute();

                $new_best = true;
                $_SESSION["high_score"] = $score;
            }


            echo json_encode([
                "status"=> "success",
                "message"=> "Updated scores successfully",
                "new_best"=> $new_best,
            ]);
            exit();
        }
    }
}
echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
exit();
?>