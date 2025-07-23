class ApiContext {
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
}