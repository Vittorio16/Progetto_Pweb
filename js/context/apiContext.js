export class ApiContext {
    constructor(){}

    async signup(username, email, password){
        const payload = {username, email, password};

        try {
            const res = await fetch("../php/signup.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }, 
                body: JSON.stringify(payload),
            });

            const resData = await res.json();
            if (resData.status === "success"){
                return {
                    user: resData.user,
                    token: resData.token,
                    loggedIn: true,
                };
            } else {
                alert(resData.message);
                return {
                    user: null,
                    token: null,
                    loggedIn: false,
                };
            }
        } catch (error) {
            console.error("Error: ", error);
            alert("An unexpected error occured");
            return {
                user: null,
                token: null,
                loggedIn: false, 
            };
        }
    }

    async login(username, password){
        const payload = {username, password};

        try {
            const res = await fetch("../php/login.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }, 
                body: JSON.stringify(payload),
            });

            const resData = await res.json();
            if (resData.status === "success"){

                return {
                    user: resData.user,
                    token: resData.token,
                    loggedIn: true,
                };
            } else {
                alert(resData.message);
                return {
                    user: null,
                    token: null,
                    loggedIn: false,
                };
            }
        } catch (error) {
            console.error("Error: ", error);
            alert("An unexpected error occured");
            return {
                user: null,
                token: null,
                loggedIn: false, 
            };
        }
    }

    async logout(){
        try {
            const res = await fetch("../php/logout.php", {
                method: "POST",
                credentials: "include"
            });

            const data = await res.json();

            if (data.status === "success") {
                return {
                    user: null,
                    token: null,
                    loggedIn: false
                };
            } else {
                throw new Error("Logout failed");
            }

        } catch (error) {
            console.error("Logout error:", error);
            return {
                user: null,
                token: null,
                loggedIn: false
            };
        }
    }

    async check_logged_in(){
        try{
            const res = await fetch("../php/check_session.php", {
                method: "GET",
                credentials: "include"
            }); 

            const data = await res.json();
            if (data.status === "success"){
                return {
                    user: data.user,
                    token: data.token,
                    loggedIn: true,
                };
            } else {
                return {
                    user: null,
                    token: null,
                    loggedIn: false,
                };
            }
        } catch(error) {
            console.log("Session check failed:", error);
            return {
                user: null,
                token: null,
                loggedIn: false,
            }
        }
    }

    async viewHistory(){
        try {
            const res = await fetch("../php/get_history.php", {
                method: "POST",
                credentials: "include"
            });

            const data = await res.json();
            if (data.status === "success"){
                return data.games;
            } else {
                return null;
            }
        } catch(error){
            return null;
        }
    }


    async viewScoreboard(){
        try {
            const res = await fetch("../php/get_scoreboard.php", {
                method: "POST",
                credentials: "include"
            });

            const data = await res.json();
            if (data.status === "success"){
                console.log(data.games);
                return data.games;
            } else {
                return null;
            }
        } catch(error){
            return null;
        }
    }
}