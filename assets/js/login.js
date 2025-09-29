import { initializeApp }
 from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
import {   getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup }
 from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"

const firebaseConfig = {
  apiKey: "AIzaSyC0WdwNITU-pxjo_MTP_IXNZgMwYeQytJk",
  authDomain: "payplanner-c3dd0.firebaseapp.com",
  projectId: "payplanner-c3dd0",
  storageBucket: "payplanner-c3dd0.firebasestorage.app",
  messagingSenderId: "598849178122",
  appId: "1:598849178122:web:2f4c58ef3cdf7477baadf3",
  measurementId: "G-MEEXR58R72"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault()
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value

  try {
    await signInWithEmailAndPassword(auth, email, password)
    alert("Login realizado com sucesso!")
    window.location.href = "../pages/home.html"
  } catch (error) {
    alert("Erro no login: " + error.message)
  }
})


document.querySelectorAll(".toggle-password").forEach(btn => {
  const olhoAberto = "https://img.icons8.com/?size=100&id=59814&format=png&color=22C55E";
  const olhoFechado = "https://img.icons8.com/?size=100&id=60022&format=png&color=22C55E";

  btn.innerHTML = `<img src="${olhoFechado}" alt="Mostrar senha" width="20">`;

  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    const img = btn.querySelector("img");

    if (input.type === "password") {
      input.type = "text";
      img.src = olhoAberto;
    } else {
      input.type = "password";
      img.src = olhoFechado;
    }
  });
});