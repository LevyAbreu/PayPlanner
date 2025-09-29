import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } 
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
import { getAuth, signOut, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
import { initializeApp } 
 from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"

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

let currentChart;
let expenses = [];
let moneyTransactions = [];
let investments = [];
let userData = {};
let expenseToDelete = null;
let currentHistoryType = 'gastos';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function showMessage(elementId, message, type) {
  const messageElement = document.getElementById(elementId);
  messageElement.textContent = message;
  messageElement.className = `form-message ${type}`;
  messageElement.style.display = 'block';
  
  setTimeout(() => {
    messageElement.style.display = 'none';
  }, 5000);
}

function calculateFinancialData() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const debtsToPay = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear &&
             expense.status !== 'paid';
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const paidDebts = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear &&
             expense.status === 'paid';
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const totalMoney = moneyTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalInvestments = investments.reduce((sum, investment) => sum + investment.amount, 0);
  const totalPendingExpenses = expenses
    .filter(expense => expense.status !== 'paid')
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const availableMoney = totalMoney - totalPendingExpenses;
  
  const payVariation = 42.8;
  const paidVariation = -24.3;
  const moneyVariation = -18.4;
  
  return {
    debtsToPay,
    paidDebts,
    availableMoney,
    totalInvestments,
    payVariation,
    paidVariation,
    moneyVariation
  };
}

async function loadUserData() {
  const user = auth.currentUser;
  if (!user) return;
  
  document.getElementById('userName').textContent = user.displayName || user.email.split('@')[0];
  
  await loadExpenses();
  await loadMoneyTransactions();
  await loadInvestments();
  
  const financialData = calculateFinancialData();
  
  document.getElementById('debtsToPay').textContent = formatCurrency(financialData.debtsToPay);
  document.getElementById('paidDebts').textContent = formatCurrency(financialData.paidDebts);
  document.getElementById('availableMoney').textContent = formatCurrency(financialData.availableMoney);
  
  document.getElementById('payVariation').textContent = `${financialData.payVariation > 0 ? '+' : ''}${financialData.payVariation}%`;
  document.getElementById('paidVariation').textContent = `${financialData.paidVariation > 0 ? '+' : ''}${financialData.paidVariation}%`;
  document.getElementById('moneyVariation').textContent = `${financialData.moneyVariation > 0 ? '+' : ''}${financialData.moneyVariation}%`;
}

async function loadExpenses() {
  expenses = [];
  const user = auth.currentUser;
  if (!user) return;

  try {
    const q = query(
      collection(db, "debts"),
      where("userId", "==", user.uid),
      orderBy("date", "desc")
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      let expenseDate = data.date;
      if (expenseDate && expenseDate.includes('T')) {
        expenseDate = expenseDate.split('T')[0];
      }
      
      expenses.push({ 
        id: docSnap.id, 
        ...data,
        amount: data.value,
        date: expenseDate
      });
    });
    
    loadHistory();
  } catch (error) {
    console.error("Erro ao carregar despesas:", error);
  }
}

async function loadMoneyTransactions() {
  moneyTransactions = [];
  const user = auth.currentUser;
  if (!user) return;

  try {
    const q = query(
      collection(db, "money_transactions"),
      where("userId", "==", user.uid),
      orderBy("date", "desc")
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      moneyTransactions.push({ 
        id: docSnap.id, 
        ...docSnap.data() 
      });
    });
  } catch (error) {
    console.error("Erro ao carregar transações:", error);
  }
}

async function loadInvestments() {
  investments = [];
  const user = auth.currentUser;
  if (!user) return;

  try {
    const q = query(
      collection(db, "investments"),
      where("userId", "==", user.uid),
      orderBy("date", "desc")
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      investments.push({ 
        id: docSnap.id, 
        ...docSnap.data() 
      });
    });
  } catch (error) {
    console.error("Erro ao carregar investimentos:", error);
  }
}

function createAccumulatedMoneyChart() {
  const ctx = document.getElementById('accumulatedMoneyChart');
  
  if (currentChart) {
    currentChart.destroy();
  }
  
  const monthlyData = calculateMonthlyData();
  
  currentChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      datasets: [{
        label: 'Valor Acumulado',
        data: monthlyData,
        backgroundColor: monthlyData.map((_, index) => 
          index === 3 || index === 7 || index === 11 ? '#bfff00' : '#9d5cff'
        ),
        borderRadius: 8,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: { 
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `R$ ${context.parsed.y.toLocaleString('pt-BR')}`;
            }
          }
        }
      },
      scales: {
        y: { 
          ticks: { color: '#aaa' }, 
          grid: { color: '#222' },
          beginAtZero: true
        },
        x: { 
          ticks: { color: '#aaa' }, 
          grid: { color: '#222' }
        }
      }
    }
  });
}

function calculateMonthlyData() {
  const currentYear = new Date().getFullYear();
  const monthlyData = new Array(12).fill(0);
  
  moneyTransactions.forEach(transaction => {
    const transactionDate = new Date(transaction.date);
    if (transactionDate.getFullYear() === currentYear) {
      const month = transactionDate.getMonth();
      monthlyData[month] += transaction.amount;
    }
  });
  
  investments.forEach(investment => {
    const investmentDate = new Date(investment.date);
    if (investmentDate.getFullYear() === currentYear) {
      const month = investmentDate.getMonth();
      monthlyData[month] += investment.amount;
    }
  });
  
  return monthlyData;
}

function loadHistory() {
  const historyList = document.getElementById('expenseHistoryList');
  historyList.innerHTML = '';
  
  const filteredItems = filterItemsByDate();
  const searchTerm = document.getElementById('expenseSearch').value.toLowerCase();
  
  const filteredAndSearchedItems = filteredItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm) ||
    (item.category && item.category.toLowerCase().includes(searchTerm)) ||
    (item.type && item.type.toLowerCase().includes(searchTerm)) ||
    formatCurrency(item.amount).toLowerCase().includes(searchTerm)
  );
  
  filteredAndSearchedItems.forEach(item => {
    const li = document.createElement('li');
    
    if (currentHistoryType === 'gastos') {
      li.innerHTML = `
        <div class="expense-info">
          <strong class="expense-name">${item.name}</strong>
          <p>${formatCurrency(item.amount)}</p>
          <p>Categoria: ${item.category}</p>
          <p>Status: ${item.status === 'paid' ? 'Paga' : 'Devendo'}</p>
          <small>${new Date(item.date).toLocaleDateString('pt-BR')}</small>
        </div>
        <div class="expense-actions">
          <button class="btn-action btn-edit" data-id="${item.id}" data-type="gastos">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action btn-delete" data-id="${item.id}" data-type="gastos">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    } else if (currentHistoryType === 'ganhos') {
      li.innerHTML = `
        <div class="expense-info">
          <strong class="expense-name">${item.name}</strong>
          <p>${formatCurrency(item.amount)}</p>
          <p>Tipo: ${getMoneyTypeLabel(item.type)}</p>
          <small>${new Date(item.date).toLocaleDateString('pt-BR')}</small>
        </div>
        <div class="expense-actions">
          <button class="btn-action btn-edit" data-id="${item.id}" data-type="ganhos">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action btn-delete" data-id="${item.id}" data-type="ganhos">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    } else if (currentHistoryType === 'investimentos') {
      li.innerHTML = `
        <div class="expense-info">
          <strong class="expense-name">${item.name}</strong>
          <p>${formatCurrency(item.amount)}</p>
          <p>Tipo: ${getInvestmentTypeLabel(item.type)}</p>
          <small>${new Date(item.date).toLocaleDateString('pt-BR')}</small>
        </div>
        <div class="expense-actions">
          <button class="btn-action btn-edit" data-id="${item.id}" data-type="investimentos">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action btn-delete" data-id="${item.id}" data-type="investimentos">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }
    
    historyList.appendChild(li);
  });

  initHistoryActions();
}

function getMoneyTypeLabel(type) {
  const labels = {
    'salario': 'Salário',
    'investimento': 'Investimento',
    'presente': 'Presente',
    'extra': 'Extra',
    'outros': 'Outros'
  };
  return labels[type] || type;
}

function getInvestmentTypeLabel(type) {
  const labels = {
    'renda_fixa': 'Renda Fixa',
    'renda_variavel': 'Renda Variável',
    'poupanca': 'Poupança',
    'criptomoedas': 'Criptomoedas',
    'fundos': 'Fundos de Investimento'
  };
  return labels[type] || type;
}

function filterItemsByDate() {
  const dateFilter = document.getElementById('dateFilter').value;
  const today = new Date();
  
  let items = [];
  
  switch(currentHistoryType) {
    case 'gastos':
      items = expenses;
      break;
    case 'ganhos':
      items = moneyTransactions;
      break;
    case 'investimentos':
      items = investments;
      break;
  }
  
  return items.filter(item => {
    const itemDate = new Date(item.date);
    
    switch(dateFilter) {
      case 'day':
        return itemDate.toDateString() === today.toDateString();
      case 'month':
        return itemDate.getMonth() === today.getMonth() && 
               itemDate.getFullYear() === today.getFullYear();
      case 'year':
        return itemDate.getFullYear() === today.getFullYear();
      default:
        return true;
    }
  });
}

function initHistoryActions() {
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', function() {
      const itemId = this.getAttribute('data-id');
      const itemType = this.getAttribute('data-type');
      
      if (itemType === 'gastos') {
        openEditExpenseModal(itemId);
      }
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', function() {
      const itemId = this.getAttribute('data-id');
      const itemType = this.getAttribute('data-type');
      
      if (itemType === 'gastos') {
        openDeleteConfirmModal(itemId);
      }
    });
  });
}

function filterHistory(searchTerm) {
  loadHistory();
}

function initHistorySelector() {
  const historyTypeSelect = document.getElementById('historyType');
  
  historyTypeSelect.addEventListener('change', function() {
    currentHistoryType = this.value;
    loadHistory();
    
    const searchInput = document.getElementById('expenseSearch');
    switch(currentHistoryType) {
      case 'gastos':
        searchInput.placeholder = 'Buscar despesa...';
        break;
      case 'ganhos':
        searchInput.placeholder = 'Buscar ganho...';
        break;
      case 'investimentos':
        searchInput.placeholder = 'Buscar investimento...';
        break;
    }
  });
}

function openEditExpenseModal(expenseId) {
  const expense = expenses.find(exp => exp.id === expenseId);
  if (!expense) return;

  document.getElementById('editExpenseId').value = expense.id;
  document.getElementById('editExpenseName').value = expense.name;
  document.getElementById('editExpenseAmount').value = expense.amount;
  document.getElementById('editExpenseCategory').value = expense.category;
  document.getElementById('editExpenseStatus').value = expense.status;
  document.getElementById('editExpenseDate').value = expense.date;

  const modal = document.getElementById('editExpenseModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openDeleteConfirmModal(expenseId) {
  const expense = expenses.find(exp => exp.id === expenseId);
  if (!expense) return;

  expenseToDelete = expense;

  document.getElementById('deleteExpenseName').textContent = expense.name;
  document.getElementById('deleteExpenseDetails').textContent = 
    `${formatCurrency(expense.amount)} - ${expense.category} - ${new Date(expense.date).toLocaleDateString('pt-BR')}`;

  const modal = document.getElementById('deleteConfirmModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeEditExpenseModal() {
  const modal = document.getElementById('editExpenseModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function closeDeleteConfirmModal() {
  const modal = document.getElementById('deleteConfirmModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
  expenseToDelete = null;
}

async function updateExpense(event) {
  event.preventDefault();
  
  const expenseId = document.getElementById('editExpenseId').value;
  const name = document.getElementById('editExpenseName').value;
  const amount = parseFloat(document.getElementById('editExpenseAmount').value);
  const category = document.getElementById('editExpenseCategory').value;
  const status = document.getElementById('editExpenseStatus').value;
  const date = document.getElementById('editExpenseDate').value;
  
  if (!name || !amount || !category || !status || !date) {
    showMessage('editExpenseMessage', 'Por favor, preencha todos os campos!', 'error');
    return;
  }

  try {
    const expenseRef = doc(db, "debts", expenseId);
    await updateDoc(expenseRef, {
      name: name,
      value: amount,
      category: category,
      status: status,
      date: date,
      updatedAt: new Date()
    });

    closeEditExpenseModal();
    document.getElementById('editExpenseForm').reset();
    
    await loadUserData();
    
    showMessage('editExpenseMessage', 'Despesa atualizada com sucesso!', 'success');
  } catch (error) {
    console.error("Erro ao atualizar despesa:", error);
    showMessage('editExpenseMessage', 'Erro ao atualizar despesa. Tente novamente.', 'error');
  }
}

async function deleteExpense() {
  if (!expenseToDelete) return;

  try {
    await deleteDoc(doc(db, "debts", expenseToDelete.id));
    
    closeDeleteConfirmModal();
    await loadUserData();
    
    showMessage('expenseMessage', 'Despesa excluída com sucesso!', 'success');
  } catch (error) {
    console.error("Erro ao excluir despesa:", error);
    showMessage('expenseMessage', 'Erro ao excluir despesa. Tente novamente.', 'error');
  }
}

function initProfileMenu() {
  const menuItems = document.querySelectorAll('.menu-item');
  
  menuItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const action = this.textContent.trim();
      
      switch(action) {
        case 'Perfil':
          alert('Abrindo perfil do usuário...');
          break;
        case 'Configurações':
          alert('Abrindo configurações...');
          break;
        case 'Sair':
          if(confirm('Tem certeza que deseja sair?')) {
            signOut(auth).then(() => {
              window.location.href = "../pages/login.html";
            }).catch((error) => {
              console.error("Erro ao fazer logout:", error);
            });
          }
          break;
      }
    });
  });
}

function openMoneyModal() {
  const modal = document.getElementById('moneyModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openInvestModal() {
  const modal = document.getElementById('investModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openExpenseModal() {
  const modal = document.getElementById('expenseModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMoneyModal() {
  const modal = document.getElementById('moneyModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function closeInvestModal() {
  const modal = document.getElementById('investModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function closeExpenseModal() {
  const modal = document.getElementById('expenseModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

async function addNewMoney(event) {
  event.preventDefault();
  
  const name = document.getElementById('moneyName').value;
  const amount = parseFloat(document.getElementById('moneyAmount').value);
  const type = document.getElementById('moneyType').value;
  const date = document.getElementById('moneyDate').value;
  
  if (!name || !amount || !type || !date) {
    showMessage('moneyMessage', 'Por favor, preencha todos os campos!', 'error');
    return;
  }
  
  const user = auth.currentUser;
  if (!user) {
    showMessage('moneyMessage', 'Você precisa estar logado para adicionar dinheiro.', 'error');
    return;
  }

  try {
    const moneyData = {
      name: name,
      amount: amount,
      type: type,
      date: date,
      userId: user.uid,
      createdAt: new Date()
    };
    
    await addDoc(collection(db, "money_transactions"), moneyData);

    closeMoneyModal();
    document.getElementById('moneyForm').reset();
    document.getElementById('moneyDate').value = getLocalDateString();
    
    await loadUserData();
    
    showMessage('moneyMessage', 'Dinheiro adicionado com sucesso!', 'success');
  } catch (error) {
    console.error("Erro ao adicionar dinheiro:", error);
    showMessage('moneyMessage', 'Erro ao adicionar dinheiro. Tente novamente.', 'error');
  }
}

async function addNewInvestment(event) {
  event.preventDefault();
  
  const name = document.getElementById('investName').value;
  const amount = parseFloat(document.getElementById('investAmount').value);
  const type = document.getElementById('investType').value;
  const date = document.getElementById('investDate').value;
  
  if (!name || !amount || !type || !date) {
    showMessage('investMessage', 'Por favor, preencha todos os campos!', 'error');
    return;
  }
  
  const user = auth.currentUser;
  if (!user) {
    showMessage('investMessage', 'Você precisa estar logado para adicionar investimentos.', 'error');
    return;
  }

  try {
    const investmentData = {
      name: name,
      amount: amount,
      type: type,
      date: date,
      userId: user.uid,
      createdAt: new Date()
    };
    
    await addDoc(collection(db, "investments"), investmentData);

    closeInvestModal();
    document.getElementById('investForm').reset();
    document.getElementById('investDate').value = getLocalDateString();
    
    await loadUserData();
    
    showMessage('investMessage', 'Investimento adicionado com sucesso!', 'success');
  } catch (error) {
    console.error("Erro ao adicionar investimento:", error);
    showMessage('investMessage', 'Erro ao adicionar investimento. Tente novamente.', 'error');
  }
}

async function addNewExpense(event) {
  event.preventDefault();
  
  const name = document.getElementById('expenseName').value;
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const category = document.getElementById('expenseCategory').value;
  const status = document.getElementById('expenseStatus').value;
  const date = document.getElementById('expenseDate').value;
  
  if (!name || !amount || !category || !status || !date) {
    showMessage('expenseMessage', 'Por favor, preencha todos os campos!', 'error');
    return;
  }
  
  const user = auth.currentUser;
  if (!user) {
    showMessage('expenseMessage', 'Você precisa estar logado para adicionar despesas.', 'error');
    return;
  }

  try {
    const expenseData = {
      name: name,
      value: amount,
      category: category,
      status: status,
      date: date,
      userId: user.uid,
      createdAt: new Date()
    };
    
    await addDoc(collection(db, "debts"), expenseData);

    closeExpenseModal();
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseDate').value = getLocalDateString();
    
    await loadUserData();
    
    showMessage('expenseMessage', 'Despesa adicionada com sucesso!', 'success');
  } catch (error) {
    console.error("Erro detalhado ao adicionar despesa:", error);
    showMessage('expenseMessage', 'Erro ao adicionar despesa. Tente novamente.', 'error');
  }
}

function initModals() {
  document.getElementById('addMoneyBtn').addEventListener('click', openMoneyModal);
  document.getElementById('addInvestBtn').addEventListener('click', openInvestModal);
  document.getElementById('addExpenseBtn').addEventListener('click', openExpenseModal);
  
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = this.closest('.modal-backdrop');
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
  });
  
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });
  });
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop').forEach(modal => {
        modal.classList.remove('active');
      });
      document.body.style.overflow = 'auto';
    }
  });
  
  document.getElementById('moneyForm').addEventListener('submit', addNewMoney);
  document.getElementById('investForm').addEventListener('submit', addNewInvestment);
  document.getElementById('expenseForm').addEventListener('submit', addNewExpense);
  document.getElementById('editExpenseForm').addEventListener('submit', updateExpense);
  
  document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteConfirmModal);
  document.getElementById('confirmDeleteBtn').addEventListener('click', deleteExpense);
  
  const today = getLocalDateString();
  document.getElementById('moneyDate').value = today;
  document.getElementById('investDate').value = today;
  document.getElementById('expenseDate').value = today;
}

document.addEventListener('DOMContentLoaded', function() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      initProfileMenu();
      initModals();
      initHistorySelector();
      
      loadUserData().then(() => {
        createAccumulatedMoneyChart();
      });
      
      document.getElementById('expenseSearch').addEventListener('input', function() {
        filterHistory(this.value.toLowerCase());
      });
      
      document.getElementById('dateFilter').addEventListener('change', function() {
        loadHistory();
      });
      
      document.getElementById('monthlyViewBtn').addEventListener('click', function() {
        document.querySelectorAll('.view-toggle button').forEach(btn => {
          btn.classList.remove('active');
        });
        this.classList.add('active');
        createAccumulatedMoneyChart();
      });
      
      document.getElementById('yearlyViewBtn').addEventListener('click', function() {
        document.querySelectorAll('.view-toggle button').forEach(btn => {
          btn.classList.remove('active');
        });
        this.classList.add('active');
        createAccumulatedMoneyChart();
      });
    } else {
      window.location.href = "../pages/login.html";
    }
  });
});