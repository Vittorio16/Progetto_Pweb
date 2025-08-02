<?php
require_once "dbaccess.php";
session_start();

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$conn =  mysqli_connect(DBHOST, DBUSER, DBPASS,  DBNAME);

if ($conn->connect_error) {
    die("DB connection failed: ". mysqli_connect_error());
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    if (isset($_SESSION['user_id'], $_SESSION['token'], $_COOKIE['session_token'])) {
        if (hash_equals($_SESSION['token'], $_COOKIE['session_token'])) {

            $inputJSON = file_get_contents('php://input');
            $input = json_decode($inputJSON, true);

            $game_id = $input['gameId'];
            $event_type = $input['event_type'];

            if (!$_SESSION["game_in_progress"]){
                echo json_encode(['status' => 'error', 'message' => 'Game not in progress']);
                exit();
            }

            if ($game_id != $_SESSION['game_id'] || !$event_type) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid info sent to the server']);
                exit();
            }

            $query = $conn->prepare('INSERT INTO game_events (game_id, user_id, event_type) VALUES (?,?,?)');
            $query->bind_param('iis', $game_id, $_SESSION["user_id"], $event_type);
            $query->execute();

            echo json_encode(['status'=> 'success','message'=> 'game data added sucessfully']);
            exit();
        }
    }
}
echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
exit();
?>