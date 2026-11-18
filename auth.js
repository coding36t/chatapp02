
import { auth, db } from "./firebase.config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import {
    ref,
    set,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";

const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const errorBox = document.getElementById("auth-error");

// SIGNUP
if (signupForm) {

    signupForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name = document.getElementById("display-name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            await updateProfile(user, {
                displayName: name
            });

            await set(ref(db, "users/" + user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                createdAt: serverTimestamp()
            });

            window.location.href = "dashboard.html";

        } catch (error) {

            errorBox.textContent = error.message;
            console.log(error);

        }

    });

}


// LOGIN
if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            window.location.href = "dashboard.html";

        } catch (error) {

            errorBox.textContent = error.message;
            console.log(error);

        }

    });

}
