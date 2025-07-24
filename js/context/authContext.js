class AuthContext {
    constructor(){
        this.user = null;
        this.token = null;
        this.loggedIn = false;
    }

    async handleSignup(event) {
        event.preventDefault();

        const usernameInput = document.getElementById("signup-username");
        const emailInput = document.getElementById("signup-email");
        const passwordInput = document.getElementById("signup-password");

        if (!usernameInput.validity.valid){

            alert("The username must be between 3 and 20 characters long. \nOther than letters and numbers, allowed characters are: ! # $ % & * ^ _ - ~");
            return;
        }

        if (!emailInput.validity.valid){
            alert("Please enter a valid email address");
            return;
        }

        if (!passwordInput.validity.valid){
            alert("The password must be between 6 and 30 characters long. \nOther than letters and numbers, allowed characters are: ! # $ % & * ^ _ - ~");
            return;
        }

        const username = usernameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;

        const {user, token, loggedIn} = await apiContext.signup(username, email, password);

        this.user = user;
        this.token = token;
        this.loggedIn = loggedIn;

        if (loggedIn){
            userHomePage.displayProfile();
        }
    }

    async handleLogin(event){
        event.preventDefault();

        const usernameInput = document.getElementById("login-username");
        const passwordInput = document.getElementById("login-password");

        if (!usernameInput.validity.valid){
            alert("The username must be between 3 and 20 characters long. \nOther than letters and numbers, allowed characters are: ! # $ % & * ^ _ - ~");
            return;
        }

        if (!passwordInput.validity.valid){
            alert("The password must be between 6 and 30 characters long. \nOther than letters and numbers, allowed characters are: ! # $ % & * ^ _ - ~");
            return;
        }

        const username = usernameInput.value;
        const password = passwordInput.value;

        const {user, token, loggedIn} = await apiContext.login(username, password);

        this.user = user;
        this.token = token;
        this.loggedIn = loggedIn;

        if (loggedIn){
            userHomePage.displayProfile();
        }
    }

    async handleLogout(event){
        event.preventDefault();

        const {user, token, loggedIn} = await apiContext.logout();

        this.user = user;
        this.token = token;
        this.loggedIn = loggedIn;

        userHomePage.logout();
    }
}