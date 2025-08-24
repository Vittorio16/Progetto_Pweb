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
    $password = $input['password'] ?? '';

    $user_pattern = "/^[A-Za-z0-9!#$%&*^_-~]{3,20}$/";
    $pass_pattern = "/^[A-Za-z0-9!#$%&*^_\-~]{6,30}$/";

    // Last check on the validity of inputs
    if (!preg_match($user_pattern, $username)) {
        echo json_encode([
            "status" => "error",
            "message" => "The username must be between 3 and 20 characters long. \nOther than letters and numbers, allowed characters are: ! # $ % & * ^ _ - ~",
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

    // Only one account per email
    $query = $conn->prepare("SELECT user_id, username, email, password FROM users WHERE username=?");
    $query->bind_param("s", $username);
    $query->execute();

    $result = $query->get_result();
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();

        if (password_verify($password, $user["password"])) {

            // User found and password correct
            $token = bin2hex(random_bytes(32));

            $_SESSION["user_id"] = $user["user_id"];
            $_SESSION["token"] = $token;
            $_SESSION["username"] = $user["username"];
            $_SESSION["email"] = $user["email"];
            $_SESSION["game_in_progress"] = false;
            $_SESSION["game_id"] = null;
            
            setcookie("session_token", $token, [
                'expires' => time() + 3600,
                'path' => '/',
                'secure' => true,           
                'httponly' => true,
                'samesite' => 'Strict',
            ]);


            $query = $conn->prepare("SELECT score FROM user_scores WHERE user_id = ?");
            $query->bind_param("i", $user["user_id"]);
            $query->execute();

            $result = $query->get_result();

            $high_score = 0;
            while ($row = $result->fetch_assoc()) {
                if ($row["score"] > $high_score) {
                    $high_score = $row["score"];
                }
            }
            $_SESSION["high_score"] = $high_score;

            echo json_encode([
                "status"=> "success",
                "message"=> "User logged in",
                "user" => [
                    "user_id" => $user["user_id"],
                    "username" => $user["username"],
                    "email" => $user["email"],
                    "high_score" => $high_score,
                ],
                "token" => $token,
                ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message"=> "Incorrect password",
            ]);
        }
    } else {
        // Username non presente nel db
        echo json_encode([
            "status" => "error",
            "message" => "User not found",
        ]);
        exit();
    }
    $query->close();
}
$conn->close()
?>