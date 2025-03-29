if (location.hostname === "localhost") {
  document.querySelectorAll("a").forEach((x) => (x.href += ".html"));
}

// Import the functions you need from the SDKs you need
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";
import { analytics, auth, existsUser, writeUserData } from "./firebase.js";
import { disableInput, emailToCurso, enableInput, isAdmin } from "./tools.js";

logEvent(analytics, location.pathname.slice(1) || "index");

const logInOutButton = document.querySelector("#session");
const userLogo = document.querySelector("#userLogo");

if (logInOutButton && userLogo) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/auth.user
      const uid = user.uid;
      if (!user.email.endsWith("@retamar.es")) {
        signOut(auth);
        alert("El correo debe ser de Retamar");
      }
      if (!(await existsUser(uid))) {
        writeUserData(uid, user.displayName, user.email, user.photoURL);
      }
      logInOutButton.innerText = "Cerrar Sesión";
      userLogo.src = user.photoURL;
      document.querySelector(".sessionOn")?.classList.remove("hidden");
      document.querySelector("#menuStats")?.classList.remove("hidden");
      document.querySelector("footer")?.classList.add("hidden");

      if (isAdmin(user.email)) {
        document.querySelector("#menuAdmin")?.classList.remove("hidden");
      }
      if (emailToCurso(user.email) === "2º bach") {
        document
          .querySelectorAll("[name=selection]")
          .forEach((x) => disableInput(x));
      }
    } else {
      logInOutButton.innerText = "Iniciar Sesión";
      userLogo.src = "./user-solid.svg";
      document.querySelector(".sessionOn")?.classList.add("hidden");
      document.querySelector("#menuAdmin")?.classList.add("hidden");
      document.querySelector("#menuStats")?.classList.add("hidden");

      if (localStorage.getItem("footer") !== "hidden") {
        document.querySelector("footer")?.classList.remove("hidden");
      }
      document
        .querySelectorAll("[name=selection]")
        .forEach((x) => enableInput(x));
    }
  });

  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");
  provider.setCustomParameters({
    login_hint: "@retamar.es",
  });

  logInOutButton.addEventListener("click", () => {
    if (auth.currentUser) {
      signOut(auth);
    } else {
      signInWithPopup(auth, provider);
    }
  });
}

document.querySelector("#ocultar")?.addEventListener("click", () => {
  document.querySelector("footer")?.classList.add("hidden");
  localStorage.setItem("footer", "hidden");
});

if (localStorage.getItem("footer") === "hidden") {
  document.querySelector("footer")?.classList.add("hidden");
}
