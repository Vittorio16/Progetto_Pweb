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

            // If a game is already in progress, can't start another one
            if ($_SESSION["game_in_progress"]){
                echo json_encode(['status' => 'error', 'message' => 'Game already in progress']);
                exit();
            }

            // Returns a game id
            $_SESSION["game_id"] = 1;
            echo json_encode(['status'=> 'success', 'game_id'=> null]);
            exit();
        }
    }
}
echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
exit();
?>