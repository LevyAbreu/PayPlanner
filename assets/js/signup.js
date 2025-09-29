import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"

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

function validarSenha(password) {
  const errors = []
  if (!/[0-9]/.test(password)) errors.push("A senha deve conter ao menos 1 número.")
  if (!/[a-z]/.test(password)) errors.push("A senha deve conter ao menos 1 letra minúscula.")
  if (!/[A-Z]/.test(password)) errors.push("A senha deve conter ao menos 1 letra maiúscula.")
  if (!/[!@#$%^&*()\-+.,]/.test(password)) errors.push("A senha deve conter ao menos 1 caractere especial.")
  if (password.length < 6) errors.push("A senha deve ter no mínimo 6 caracteres.")
  return errors
}

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const name = document.getElementById("name").value
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const passwordConfirm = document.getElementById("passwordConfirm").value

  if (password !== passwordConfirm) {
    alert("As senhas não coincidem!")
    return
  }

  const errosSenha = validarSenha(password)
  if (errosSenha.length > 0) {
    alert(errosSenha.join("\n"))
    return
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(userCredential.user, { displayName: name })

    alert("Conta criada com sucesso!")
    window.location.href = "../pages/home.html"
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      alert("Este e-mail já está cadastrado!")
    } else {
      alert("Erro no cadastro: " + error.message)
    }
  }
})

document.querySelectorAll(".toggle-password").forEach(btn => {
  const olhoAberto = "https://img.icons8.com/?size=100&id=59814&format=png&color=22C55E"
  const olhoFechado = "https://img.icons8.com/?size=100&id=60022&format=png&color=22C55E"

  btn.innerHTML = `<img src="${olhoFechado}" alt="Mostrar senha" width="20">`

  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target)
    const img = btn.querySelector("img")

    if (input.type === "password") {
      input.type = "text"
      img.src = olhoAberto
    } else {
      input.type = "password"
      img.src = olhoFechado
    }
  })
})
