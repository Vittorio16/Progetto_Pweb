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

    $username = $input['username'] ?? '';
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';

    $user_pattern = "/^[A-Za-z0-9!#$%&*^_-~]{3,20}$/";
    $email_pattern = "/^[^@]+@[^@]+\.[^@]+$/";
    $pass_pattern = "/^[A-Za-z0-9!#$%&*^_\-~]{6,30}$/";

    // Last check on the validity of inputs
    if (!preg_match($user_pattern, $username)) {
        echo json_encode([
            "status" => "error",
            "message" => "The username must be between 3 and 20 characters long. \nOther than letters and numbers, allowed characters are: ! # $ % & * ^ _ - ~",
        ]);
        exit();
    }

    if (!preg_match($email_pattern, $email)) {
        echo json_encode([
            "status" => "error",
            "message" => "Please enter a valid email",
        ]);
        exit();
    }

    if (!preg_match($pass_pattern, $password)) {
        echo json_encode([
            "status" => "error",
            "message" => "The password must be between 6 and 30 characters long. \nOther than letters and numbers, allowed characters are: ! # $ % & * ^ _ - ~",
        ]);
        exit();
    }

    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Only one account per email
    $query = $conn->prepare("SELECT user_id FROM users WHERE email=?");
    $query->bind_param("s", $email);
    $query->execute();

    $result = $query->get_result();
    if ($result->num_rows > 0) {
        echo json_encode([
            "status" => "error",
            "message" => "There is already an account associated with this email.",
        ]);
        exit();
    }

    // Username must be unique
    $query = $conn->prepare("SELECT user_id FROM users WHERE username=?");
    $query->bind_param("s", $username);
    $query->execute();

    $result = $query->get_result();
    if ($result->num_rows > 0) {
        echo json_encode([
            "status" => "error",
            "message" => "There is already an account with this username.",
        ]);
        exit();
    }

    // All inputs are valid, creating new user and entering session
    $query = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    $query->bind_param("sss", $username, $email, $hashed_password);
    
    
    if ($query->execute()){
        // If the query ran successfully, gets the user_id associated with the new user and returns the session token
        $user_id = $conn->insert_id;

        $high_score = 0;

        $token = bin2hex(random_bytes(32));

        $_SESSION["user_id"] = $user_id;
        $_SESSION["token"] = $token;
        $_SESSION["username"] = $username;
        $_SESSION["email"] = $email;
        $_SESSION["high_score"] = $high_score;
        $_SESSION["game_in_progress"] = false;

        setcookie("session_token", $token, [
            'expires' => time() + 3600,
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);

        echo json_encode([
            "status"=> "success",
            "message"=> "User registered",
            "user" => [
                "user_id" => $user_id,
                "username" => $username,
                "email" => $email,
                "high_score" => $high_score,
            ],
            "token" => $token,
            ]);
            
    } else {
        echo json_encode([
            "status" => "error",
            "message"=> "An unexpected error occured: ".$query->error,
        ]);
        exit();
    }

    $query->close();
}
$conn->close()
?>