import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
import { getAuth, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
import { initializeApp }
 from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
import { query, where }
 from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
 
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
const db = getFirestore(app)

// Var
let debts = []
const debtsTable = document.getElementById('debtsTable')
const debtModal = document.getElementById('debtModal')
const debtForm = document.getElementById('debtForm')
const modalTitle = document.getElementById('modalTitle')
const debtId = document.getElementById('debtId')
const debtName = document.getElementById('debtName')
const debtValue = document.getElementById('debtValue')
const debtStatus = document.getElementById('debtStatus')
const debtDate = document.getElementById('debtDate')
const totalDebtElement = document.getElementById('totalDebt')
const paidAmountElement = document.getElementById('paidAmount')
const pendingAmountElement = document.getElementById('pendingAmount')
const overdueAmountElement = document.getElementById('overdueAmount')

// User
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("userName").textContent = user.displayName || user.email
    loadDebts()
  } else {
    window.location.href = "../login.html"
  }
})

// Logout
document.getElementById("logoutBtn").addEventListener("click", async (e) => {
  e.preventDefault()
  await signOut(auth)
  window.location.href = "../login.html"
})

// Debts
async function loadDebts() {
  debts = []
  const user = auth.currentUser
  if (!user) return

  const q = query(
    collection(db, "debts"),
    where("userId", "==", user.uid)
  )

  const querySnapshot = await getDocs(q)
  querySnapshot.forEach((docSnap) => {
    debts.push({ id: docSnap.id, ...docSnap.data() })
  })

  updateSummary()
  renderDebtsTable()
}

function updateSummary() {
  let total = 0, paid = 0, pending = 0, overdue = 0
  const today = new Date()
  debts.forEach(debt => {
    total += debt.value
    if (debt.status === "paid") {
      paid += debt.value
    } else if (debt.status === "paying") {
      pending += debt.value
    } else if (debt.status === "pending") {
      const dueDate = new Date(debt.date)
      if (dueDate < today) {
        overdue += debt.value
      } else {
        pending += debt.value
      }
    }
  })
  totalDebtElement.textContent = `$${total.toFixed(2)}`
  paidAmountElement.textContent = `$${paid.toFixed(2)}`
  pendingAmountElement.textContent = `$${pending.toFixed(2)}`
  overdueAmountElement.textContent = `$${overdue.toFixed(2)}`
}

function renderDebtsTable(filter = 'all') {
  const tbody = debtsTable.querySelector('tbody')
  tbody.innerHTML = ''
  const today = new Date()
  debts.filter(debt => {
    if (filter === 'all') return true
    if (filter === 'paid') return debt.status === 'paid'
    if (filter === 'paying') return debt.status === 'paying'
    if (filter === 'pending') return debt.status === 'pending'
    if (filter === 'overdue') return debt.status === 'pending' && new Date(debt.date) < today
  }).forEach(debt => {
    const tr = document.createElement('tr')
    const dueDate = new Date(debt.date)
    const isOverdue = debt.status === 'pending' && dueDate < today
    const dueSoon = debt.status === 'pending' && !isOverdue && ((dueDate - today) / (1000 * 60 * 60 * 24) < 7)
    let statusClass = '', statusText = ''
    if (debt.status === 'paid') {
      statusClass = 'status-paid'
      statusText = 'Paga'
    } else if (debt.status === 'paying') {
      statusClass = 'status-paying'
      statusText = 'Em Pagamento'
    } else {
      statusClass = 'status-pending'
      statusText = 'Pendente'
    }    
    let dateClass = ''
    if (isOverdue) {
      dateClass = 'overdue'
    } else if (dueSoon) {
      dateClass = 'due-soon'
    }
    tr.innerHTML = `
      <td>#${debt.id.slice(0,6)}</td>
      <td>${debt.name}</td>
      <td>$${debt.value.toFixed(2)}</td>
      <td><span class="status ${statusClass}">${statusText}</span></td>
      <td class="due-date ${dateClass}">${formatDate(debt.date)}</td>
      <td class="actions-cell">
        <button class="btn-action btn-edit" onclick="editDebt('${debt.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-action btn-delete" onclick="deleteDebt('${debt.id}')"><i class="fas fa-trash"></i></button>
      </td>`
    tbody.appendChild(tr)
  })
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'numeric', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('pt-br', options)
}

// Filters
window.filterDebts = function(filter) {
  document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'))
  event.target.classList.add('active')
  renderDebtsTable(filter)
}

function openModal(id = null) {
  if (id) {
    const debt = debts.find(d => d.id === id)
    if (debt) {
      modalTitle.textContent = 'Edit Debt'
      debtId.value = debt.id
      debtName.value = debt.name
      debtValue.value = debt.value
      debtStatus.value = debt.status
      debtDate.value = debt.date
    }
  } else {
    modalTitle.textContent = 'Add New Debt'
    debtForm.reset()
    debtId.value = ''
  }
  debtModal.style.display = 'flex'
}
window.openModal = openModal

function closeModal() {
  debtModal.style.display = 'none'
}
window.closeModal = closeModal

// Create
async function handleFormSubmit(e) {
  e.preventDefault()
  const id = debtId.value
  const name = debtName.value
  const value = parseFloat(debtValue.value)
  const status = debtStatus.value
  const date = debtDate.value

  const user = auth.currentUser
  if (!user) {
    alert("Você precisa estar logado para adicionar dívidas.")
    return
  }

  if (id) {
    // Atualizar
    const debtRef = doc(db, "debts", id)
    await updateDoc(debtRef, { name, value, status, date })
  } else {
    // Criar
    await addDoc(collection(db, "debts"), { 
      name, 
      value, 
      status, 
      date,
      userId: user.uid
    })
  }

  closeModal()
  loadDebts()
}

// Update
window.editDebt = function(id) {
  openModal(id)
}

// Delete
window.deleteDebt = async function(id) {
  if (confirm('Are you sure you want to delete this debt?')) {
    await deleteDoc(doc(db, "debts", id))
    loadDebts()
  }
}

async function init() {
  document.getElementById('addDebtBtn').addEventListener('click', () => openModal())
  debtForm.addEventListener('submit', handleFormSubmit)
}

window.onclick = function(event) {
  if (event.target === debtModal) {
    closeModal()
  }
}

init()