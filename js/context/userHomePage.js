class UserHomePage {
    constructor(){}

    displayProfile(){
        this.hideForms();

        const user_home = document.getElementById("user-home");
        user_home.classList.remove("hidden");
    }
    
    showLoginForm(){
        document.getElementById("signup-form").classList.add("hidden");
        document.getElementById("login-form").classList.remove("hidden");
    }

    showSignupForm(){
        document.getElementById("login-form").classList.add("hidden");
        document.getElementById("signup-form").classList.remove("hidden");
    }

    hideForms(){
        document.getElementById("login-form").classList.add("hidden");
        document.getElementById("signup-form").classList.add("hidden");
    }

    logout(){
        document.getElementById("user-home").classList.add("hidden");
        document.getElementById("sidebar").classList.add("hidden");
        this.showSignupForm();
    }
}