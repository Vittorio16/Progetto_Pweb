<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json');

if (isset($_SESSION['user_id'], $_SESSION['token'], $_COOKIE['session_token'])) {
    if (hash_equals($_SESSION['token'], $_COOKIE['session_token'])) {
        $_SESSION["game_id"] = null;
        $_SESSION["game_in_progress"] = false;
        
        echo json_encode([
            'status' => 'success',
            'user' => [
                'user_id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'] ?? '',
                'email' => $_SESSION['email'] ?? '',
                "high_score" => $_SESSION["high_score"] ?? '',
            ],
            "token" =>  $_SESSION['token'],
        ]);
        exit();
    }
}
echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
exit();

?>