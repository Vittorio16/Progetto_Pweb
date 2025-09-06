<?php
require_once "dbaccess.php";
session_start();

$conn =  mysqli_connect(DBHOST, DBUSER, DBPASS,  DBNAME);

if ($conn->connect_error) {
    die("DB connection failed: ". mysqli_connect_error());
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    if (isset($_SESSION['user_id'], $_SESSION['token'], $_COOKIE['session_token'])) {
        if (hash_equals($_SESSION['token'], $_COOKIE['session_token'])) {

            // If a game is already in progress, it just starts another one

            // Returns a game id -- different than the one saved in the user scores db after game finishes
            // Used to authenticate input
            $conn->begin_transaction();

            $query = $conn->prepare('SELECT MAX(game_id) AS max_id FROM game_events');
            $query->execute();
            $result = $query->get_result();
            $row = $result->fetch_assoc();

            $_SESSION["game_id"] = ($row["max_id"] ?? 0) + 1;
            $_SESSION["game_in_progress"] = true;

            $event_type = "GAME_START";
            $query = $conn->prepare("INSERT INTO game_events (game_id, user_id, event_type) VALUES (?,?,?)");
            $query->bind_param( "iis", $_SESSION["game_id"], $_SESSION["user_id"], $event_type);
            $query->execute();

            $conn->commit();
            echo json_encode(['status'=> 'success', 'game_id'=> $_SESSION["game_id"]]);
            exit();
        }
    }
}
echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
exit();
?>