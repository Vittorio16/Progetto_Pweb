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

            $query = $conn->prepare('SELECT username, score, ended_at, bullets_shot, enemies_killed FROM top_scores 
                                        ORDER BY score DESC, ended_at DESC LIMIT 20');
            $query->execute();
            $result = $query->get_result();
            
            $games = [];
            while ($row = $result->fetch_assoc()) {
                $games[] = $row;
            }
            echo json_encode(["status" =>"success", "games" => $games]);
           exit();
        }
    }
}
echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
exit();
?>