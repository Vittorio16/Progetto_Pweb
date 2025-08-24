<?php
session_start();

// Remove all session variables
$_SESSION = [];

// Delete the session cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params['path'], $params['domain'],
        $params['secure'], $params['httponly']
    );
}

// Also remove the custom session_token cookie
setcookie("session_token", "", time() - 3600, "/", "", true, true);

// Finally destroy the session
session_destroy();

// Optionally, return a JSON response if called via AJAX
echo json_encode([
    "status" => "success",
    "message" => "Logged out successfully"
]);
?>
