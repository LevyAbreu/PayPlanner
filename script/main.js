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

// Variáveis
let debts = []
let moneyTransactions = []
const debtsTable = document.getElementById('debtsTable')
const debtModal = document.getElementById('debtModal')
const moneyModal = document.getElementById('moneyModal')
const debtForm = document.getElementById('debtForm')
const moneyForm = document.getElementById('moneyForm')
const modalTitle = document.getElementById('modalTitle')
const debtId = document.getElementById('debtId')
const debtName = document.getElementById('debtName')
const debtValue = document.getElementById('debtValue')
const debtStatus = document.getElementById('debtStatus')
const debtDate = document.getElementById('debtDate')
const moneyValue = document.getElementById('moneyValue')
const moneyReason = document.getElementById('moneyReason')
const moneyDate = document.getElementById('moneyDate')
const totalDebtElement = document.getElementById('totalDebt')
const paidAmountElement = document.getElementById('paidAmount')
const pendingAmountElement = document.getElementById('pendingAmount')
const overdueAmountElement = document.getElementById('overdueAmount')
const userWalletElement = document.getElementById('userWallet')

// Usuário
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("userName").textContent = user.displayName || user.email
    loadData()
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

// Carregar dados
async function loadData() {
  await loadDebts()
  await loadMoneyTransactions()
  updateSummary()
  updateWallet()
}

// Carregar dívidas
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

  renderDebtsTable()
}

// Carregar transações de dinheiro
async function loadMoneyTransactions() {
  moneyTransactions = []
  const user = auth.currentUser
  if (!user) return

  const q = query(
    collection(db, "money_transactions"),
    where("userId", "==", user.uid)
  )

  const querySnapshot = await getDocs(q)
  querySnapshot.forEach((docSnap) => {
    moneyTransactions.push({ id: docSnap.id, ...docSnap.data() })
  })
}

// Atualizar resumo das dívidas
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
  totalDebtElement.textContent = `R$${total.toFixed(2)}`
  paidAmountElement.textContent = `R$${paid.toFixed(2)}`
  pendingAmountElement.textContent = `R$${pending.toFixed(2)}`
  overdueAmountElement.textContent = `R$${overdue.toFixed(2)}`
}

// Atualizar saldo da carteira
function updateWallet() {
  // Calcular total de dinheiro adicionado
  const totalMoney = moneyTransactions.reduce((sum, transaction) => sum + transaction.value, 0)
  
  // Calcular total de dívidas pendentes (não pagas)
  const totalPendingDebts = debts
    .filter(debt => debt.status !== 'paid')
    .reduce((sum, debt) => sum + debt.value, 0)
  
  // Saldo disponível = dinheiro total - dívidas pendentes
  const availableBalance = totalMoney - totalPendingDebts
  
  userWalletElement.textContent = `R$${totalMoney.toFixed(2)} (Disponível: R$${availableBalance.toFixed(2)})`
}

// Renderizar tabela de dívidas
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
      <td>R$${debt.value.toFixed(2)}</td>
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

// Filtros
window.filterDebts = function(filter) {
  document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'))
  event.target.classList.add('active')
  renderDebtsTable(filter)
}

// Modal de dívidas
function openDebtModal(id = null) {
  if (id) {
    const debt = debts.find(d => d.id === id)
    if (debt) {
      modalTitle.textContent = 'Editar Dívida'
      debtId.value = debt.id
      debtName.value = debt.name
      debtValue.value = debt.value
      debtStatus.value = debt.status
      debtDate.value = debt.date
    }
  } else {
    modalTitle.textContent = 'Adicionar Dívida'
    debtForm.reset()
    debtId.value = ''
  }
  debtModal.style.display = 'flex'
}
window.openDebtModal = openDebtModal

// Modal de dinheiro
function openMoneyModal() {
  moneyForm.reset()
  // Definir data atual como padrão
  const today = new Date().toISOString().split('T')[0]
  moneyDate.value = today
  moneyModal.style.display = 'flex'
}
window.openMoneyModal = openMoneyModal

// Fechar modais
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none'
}
window.closeModal = closeModal

// Manipular envio do formulário de dívidas
async function handleDebtFormSubmit(e) {
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

  try {
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

    closeModal('debtModal')
    await loadData()
  } catch (error) {
    console.error("Erro ao salvar dívida:", error)
    alert("Erro ao salvar dívida. Tente novamente.")
  }
}

// Manipular envio do formulário de dinheiro
async function handleMoneyFormSubmit(e) {
  e.preventDefault()
  const value = parseFloat(moneyValue.value)
  const reason = moneyReason.value
  const date = moneyDate.value

  const user = auth.currentUser
  if (!user) {
    alert("Você precisa estar logado para adicionar dinheiro.")
    return
  }

  try {
    await addDoc(collection(db, "money_transactions"), {
      value,
      reason,
      date,
      userId: user.uid,
      createdAt: new Date()
    })

    closeModal('moneyModal')
    await loadData()
    alert("Dinheiro adicionado com sucesso!")
  } catch (error) {
    console.error("Erro ao adicionar dinheiro:", error)
    alert("Erro ao adicionar dinheiro. Tente novamente.")
  }
}

// Editar dívida
window.editDebt = function(id) {
  openDebtModal(id)
}

// Deletar dívida
window.deleteDebt = async function(id) {
  if (confirm('Tem certeza que deseja deletar esta dívida?')) {
    try {
      await deleteDoc(doc(db, "debts", id))
      await loadData()
    } catch (error) {
      console.error("Erro ao deletar dívida:", error)
      alert("Erro ao deletar dívida. Tente novamente.")
    }
  }
}

// Inicialização
async function init() {
  document.getElementById('addDebtBtn').addEventListener('click', () => openDebtModal())
  document.getElementById('addMoneyBtn').addEventListener('click', () => openMoneyModal())
  debtForm.addEventListener('submit', handleDebtFormSubmit)
  moneyForm.addEventListener('submit', handleMoneyFormSubmit)
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
  if (event.target === debtModal) {
    closeModal('debtModal')
  }
  if (event.target === moneyModal) {
    closeModal('moneyModal')
  }
}

init()