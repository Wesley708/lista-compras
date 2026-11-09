// app.js - Lógica principal da Lista de Compras Colaborativa
import { CATEGORIES, detectCategory } from './categories.js';
import { getStoredFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig } from './firebase-config.js';

// Firebase Modular SDK via CDN
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ================= ESTADO DA APLICAÇÃO =================
const state = {
  currentListId: 'nossa-casa',
  items: [],
  filter: 'all', // 'all' | 'pending' | 'purchased'
  searchQuery: '',
  showPurchasedSection: true,
  selectedCategory: CATEGORIES.find(c => c.id === 'outros') || CATEGORIES[0],
  db: null,
  unsubscribeSnapshot: null,
  isFirebaseActive: false
};

// Formatador Monetário Brasileiro (R$)
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2
});

// ================= INICIALIZAÇÃO =================
document.addEventListener('DOMContentLoaded', () => {
  initListId();
  renderCategoryChips();
  renderCategorySelectOptions();
  setupEventListeners();
  initFirebaseOrLocal();
  updateShareModalData();
  refreshLucide();
});

// Determina qual lista abrir (URL query param "?lista=..." ou localStorage ou default)
function initListId() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramList = urlParams.get('lista') || urlParams.get('list');
  
  if (paramList && paramList.trim() !== '') {
    state.currentListId = cleanListId(paramList);
  } else {
    const saved = localStorage.getItem('lista_compras_last_list');
    if (saved && saved.trim() !== '') {
      state.currentListId = cleanListId(saved);
    } else {
      state.currentListId = 'nossa-casa';
    }
  }

  localStorage.setItem('lista_compras_last_list', state.currentListId);
  updateListHeaderUI();
}

function cleanListId(id) {
  return id.toLowerCase().replace(/[^a-z0-9\-_]/g, '-').replace(/-+/g, '-').substring(0, 32);
}

function updateListHeaderUI() {
  const display = document.getElementById('currentListNameDisplay');
  if (display) {
    display.textContent = formatListTitle(state.currentListId);
  }
}

function formatListTitle(id) {
  if (id === 'nossa-casa') return '🏠 Nossa Casa';
  return id
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ================= FIREBASE OU FALLBACK LOCAL =================
function initFirebaseOrLocal() {
  const config = getStoredFirebaseConfig();
  const warningBanner = document.getElementById('firebaseWarningBanner');
  const syncDot = document.getElementById('syncDot');
  const syncText = document.getElementById('syncStatusText');

  if (state.unsubscribeSnapshot) {
    state.unsubscribeSnapshot();
    state.unsubscribeSnapshot = null;
  }

  if (config && config.apiKey && config.projectId) {
    try {
      let app;
      if (!getApps().length) {
        app = initializeApp(config);
      } else {
        app = getApps()[0];
      }
      state.db = getFirestore(app);
      state.isFirebaseActive = true;

      if (warningBanner) warningBanner.classList.add('hidden');
      if (syncDot) syncDot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
      if (syncText) syncText.textContent = 'Nuvem Conectada ⚡';

      setupRealtimeFirestoreListener();
      return;
    } catch (err) {
      console.error("Falha ao inicializar Firebase:", err);
      showToast("⚠️ Erro na config do Firebase. Usando modo local.", "error");
    }
  }

  // Fallback Local
  state.isFirebaseActive = false;
  state.db = null;
  if (warningBanner) warningBanner.classList.remove('hidden');
  if (syncDot) syncDot.className = 'w-2 h-2 rounded-full bg-amber-400';
  if (syncText) syncText.textContent = 'Modo Local (Sem Nuvem)';
  loadLocalItems();
}

// Escuta em tempo real as mudanças no Firestore
function setupRealtimeFirestoreListener() {
  const syncDot = document.getElementById('syncDot');
  const syncText = document.getElementById('syncStatusText');

  try {
    const listColRef = collection(state.db, 'shopping_lists', state.currentListId, 'items');
    const q = query(listColRef, orderBy('createdAt', 'desc'));

    state.unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach(docSnap => {
        items.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      state.items = items;
      renderAll();

      if (syncDot) syncDot.className = 'w-2 h-2 rounded-full bg-emerald-500';
      if (syncText) syncText.textContent = 'Sincronizado na Nuvem';
    }, (error) => {
      console.error("Erro no listener Firestore:", error);
      if (syncDot) syncDot.className = 'w-2 h-2 rounded-full bg-rose-500';
      if (syncText) syncText.textContent = 'Erro de Sincronização';
      showToast("Erro ao sincronizar. Verifique permissões do Firebase.", "error");
    });
  } catch (e) {
    console.error("Erro ao configurar snapshot:", e);
  }
}

// Fallback LocalStorage
function loadLocalItems() {
  try {
    const local = localStorage.getItem(`items_${state.currentListId}`);
    if (local) {
      state.items = JSON.parse(local);
    } else {
      // Itens de exemplo iniciais para degustação
      state.items = [
        { id: '1', name: 'Leite Integral', qty: 2, unit: 'un', price: 4.89, categoryId: 'laticinios', categoryName: 'Laticínios', categoryEmoji: '🥛', purchased: false, createdAt: Date.now() },
        { id: '2', name: 'Pão Francês', qty: 6, unit: 'un', price: 0.95, categoryId: 'padaria', categoryName: 'Padaria', categoryEmoji: '🥖', purchased: false, createdAt: Date.now() },
        { id: '3', name: 'Banana Prata', qty: 1, unit: 'kg', price: 6.50, categoryId: 'hortifruti', categoryName: 'Hortifrúti', categoryEmoji: '🍎', purchased: true, createdAt: Date.now() }
      ];
      saveLocalItems();
    }
    renderAll();
  } catch (e) {
    console.error("Erro ao carregar local:", e);
  }
}

function saveLocalItems() {
  if (!state.isFirebaseActive) {
    localStorage.setItem(`items_${state.currentListId}`, JSON.stringify(state.items));
  }
}

// ================= RENDERIZAÇÃO & CÁLCULOS =================
function renderAll() {
  renderFinancialSummary();
  renderItemsList();
  renderTabCounts();
  refreshLucide();
}

// Resumo financeiro com valor total, pendente e comprado
function renderFinancialSummary() {
  let totalEstimado = 0;
  let totalComprado = 0;
  let totalPendente = 0;
  let countComprado = 0;
  let countPendente = 0;

  state.items.forEach(item => {
    const qty = parseFloat(item.qty) || 1;
    const price = parseFloat(item.price) || 0;
    const subtotal = qty * price;

    totalEstimado += subtotal;

    if (item.purchased) {
      totalComprado += subtotal;
      countComprado++;
    } else {
      totalPendente += subtotal;
      countPendente++;
    }
  });

  const totalItemsCount = state.items.length;
  const progressPercent = totalItemsCount > 0 ? Math.round((countComprado / totalItemsCount) * 100) : 0;

  // Atualiza DOM
  document.getElementById('totalValue').textContent = currencyFormatter.format(totalEstimado);
  document.getElementById('progressCount').textContent = `${countComprado} de ${totalItemsCount} (${progressPercent}%)`;
  document.getElementById('progressBar').style.width = `${progressPercent}%`;

  document.getElementById('totalPurchasedValue').textContent = currencyFormatter.format(totalComprado);
  document.getElementById('totalPurchasedCount').textContent = `${countComprado} ${countComprado === 1 ? 'item' : 'itens'}`;

  document.getElementById('totalPendingValue').textContent = currencyFormatter.format(totalPendente);
  document.getElementById('totalPendingCount').textContent = `${countPendente} ${countPendente === 1 ? 'item' : 'itens'}`;

  document.getElementById('pendingSubtotalText').textContent = countPendente > 0 ? currencyFormatter.format(totalPendente) : '';
  document.getElementById('purchasedSubtotalText').textContent = countComprado > 0 ? currencyFormatter.format(totalComprado) : '';
  document.getElementById('purchasedSectionCount').textContent = countComprado;
}

function renderTabCounts() {
  const total = state.items.length;
  const pending = state.items.filter(i => !i.purchased).length;
  const purchased = state.items.filter(i => i.purchased).length;

  document.getElementById('countTabAll').textContent = total;
  document.getElementById('countTabPending').textContent = pending;
  document.getElementById('countTabPurchased').textContent = purchased;
}

// Renderiza a lista de produtos separada em "Pendentes" e "Comprados"
function renderItemsList() {
  const pendingList = document.getElementById('pendingList');
  const purchasedList = document.getElementById('purchasedList');
  const emptyState = document.getElementById('emptyState');
  const pendingSection = document.getElementById('pendingSection');
  const purchasedSection = document.getElementById('purchasedSection');

  pendingList.innerHTML = '';
  purchasedList.innerHTML = '';

  // Filtragem por busca e por aba
  let filtered = state.items.filter(item => {
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCat = (item.categoryName || '').toLowerCase().includes(q);
      if (!matchName && !matchCat) return false;
    }
    if (state.filter === 'pending') return !item.purchased;
    if (state.filter === 'purchased') return item.purchased;
    return true;
  });

  if (state.items.length === 0) {
    emptyState.classList.remove('hidden');
    pendingSection.classList.add('hidden');
    purchasedSection.classList.add('hidden');
    return;
  } else {
    emptyState.classList.add('hidden');
  }

  const pendingItems = filtered.filter(i => !i.purchased);
  const purchasedItems = filtered.filter(i => i.purchased);

  // Exibição condicional das seções conforme filtro
  if (state.filter === 'purchased') {
    pendingSection.classList.add('hidden');
    purchasedSection.classList.remove('hidden');
  } else if (state.filter === 'pending') {
    pendingSection.classList.remove('hidden');
    purchasedSection.classList.add('hidden');
  } else {
    pendingSection.classList.remove('hidden');
    purchasedSection.classList.remove('hidden');
  }

  if (pendingItems.length === 0 && state.filter !== 'purchased') {
    pendingList.innerHTML = `
      <div class="text-xs text-slate-400 italic text-center py-4 bg-white/50 rounded-xl border border-slate-200">
        Nenhum item pendente no momento 🎉
      </div>
    `;
  } else {
    pendingItems.forEach(item => {
      pendingList.appendChild(createItemCard(item));
    });
  }

  if (purchasedItems.length === 0 && state.filter !== 'pending') {
    purchasedList.innerHTML = `
      <div class="text-xs text-slate-400 italic text-center py-3 bg-white/50 rounded-xl border border-slate-200">
        Nenhum item marcado como comprado ainda.
      </div>
    `;
  } else {
    purchasedItems.forEach(item => {
      purchasedList.appendChild(createItemCard(item));
    });
  }
}

// Cria o elemento visual de cada card de produto
function createItemCard(item) {
  const card = document.createElement('div');
  const isPurchased = !!item.purchased;
  const qty = parseFloat(item.qty) || 1;
  const price = parseFloat(item.price) || 0;
  const subtotal = qty * price;
  const unit = item.unit || 'un';

  card.className = `item-card bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex items-center justify-between gap-2.5 ${isPurchased ? 'item-purchased' : ''}`;
  card.dataset.id = item.id;

  card.innerHTML = `
    <!-- Checkbox e Emoji -->
    <div class="flex items-center gap-2.5 min-w-0 flex-1">
      <input 
        type="checkbox" 
        class="custom-checkbox btn-toggle-purchased" 
        ${isPurchased ? 'checked' : ''} 
        aria-label="Marcar como comprado"
      >
      <span class="text-xl select-none shrink-0">${item.categoryEmoji || '🛒'}</span>
      
      <!-- Detalhes do Produto -->
      <div class="min-w-0 flex-1">
        <div class="flex items-baseline gap-1.5 flex-wrap">
          <span class="item-name text-sm font-bold text-slate-800 break-words leading-tight">${escapeHTML(item.name)}</span>
          <span class="text-[11px] font-semibold text-slate-400">(${qty} ${unit})</span>
        </div>
        
        <div class="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
          ${price > 0 
            ? `<span>${currencyFormatter.format(price)}/${unit}</span>
               <span class="text-slate-300">•</span>
               <span class="font-bold text-emerald-700">Subtotal: ${currencyFormatter.format(subtotal)}</span>`
            : `<span class="italic text-slate-400">Sem preço definido</span>`
          }
        </div>
      </div>
    </div>

    <!-- Stepper de Quantidade Rápida e Ações -->
    <div class="flex items-center gap-1.5 shrink-0">
      
      <!-- Stepper Rápido +/- -->
      <div class="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
        <button class="btn-step-minus w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded transition-colors text-xs font-bold" title="Diminuir quantidade">-</button>
        <span class="text-xs font-bold px-1 text-slate-700 min-w-[20px] text-center select-none">${qty}</span>
        <button class="btn-step-plus w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded transition-colors text-xs font-bold" title="Aumentar quantidade">+</button>
      </div>

      <!-- Botão Editar -->
      <button class="btn-edit-item p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Editar produto">
        <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
      </button>

      <!-- Botão Excluir -->
      <button class="btn-delete-item p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Excluir produto">
        <i data-lucide="trash" class="w-3.5 h-3.5"></i>
      </button>
    </div>
  `;

  // Listeners de evento no card
  const chk = card.querySelector('.btn-toggle-purchased');
  chk.addEventListener('change', () => toggleItemPurchased(item.id, chk.checked));

  card.querySelector('.btn-step-minus').addEventListener('click', () => stepItemQuantity(item.id, -1));
  card.querySelector('.btn-step-plus').addEventListener('click', () => stepItemQuantity(item.id, 1));
  card.querySelector('.btn-edit-item').addEventListener('click', () => openEditModal(item));
  card.querySelector('.btn-delete-item').addEventListener('click', () => deleteItem(item.id));

  return card;
}

// ================= OPERAÇÕES DE PRODUTOS =================

// Adicionar novo produto
async function handleAddItem(e) {
  e.preventDefault();
  const inputName = document.getElementById('inputItemName');
  const inputQty = document.getElementById('inputQty');
  const selectUnit = document.getElementById('selectUnit');
  const inputPrice = document.getElementById('inputPrice');

  const name = inputName.value.trim();
  if (!name) return;

  const qty = parseFloat(inputQty.value) || 1;
  const unit = selectUnit.value || 'un';
  const price = parseFloat(inputPrice.value) || 0;
  const cat = state.selectedCategory || detectCategory(name);

  const newItem = {
    name,
    qty,
    unit,
    price,
    categoryId: cat.id,
    categoryName: cat.name,
    categoryEmoji: cat.emoji,
    purchased: false,
    createdAt: Date.now()
  };

  if (state.isFirebaseActive && state.db) {
    try {
      const colRef = collection(state.db, 'shopping_lists', state.currentListId, 'items');
      await addDoc(colRef, {
        ...newItem,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      showToast(`Adicionado: ${name} ${cat.emoji}`);
    } catch (err) {
      console.error("Erro ao adicionar no Firestore:", err);
      showToast("Erro ao sincronizar item na nuvem.", "error");
    }
  } else {
    // Local
    newItem.id = 'loc_' + Date.now() + Math.random().toString(36).substring(2, 6);
    state.items.unshift(newItem);
    saveLocalItems();
    renderAll();
    showToast(`Adicionado: ${name} ${cat.emoji}`);
  }

  // Reseta formulário mantendo unidade e foco
  inputName.value = '';
  inputQty.value = '1';
  inputPrice.value = '';
  state.selectedCategory = CATEGORIES.find(c => c.id === 'outros') || CATEGORIES[0];
  updateCategoryPreview();
  inputName.focus();
}

// Alternar status de comprado
async function toggleItemPurchased(itemId, purchased) {
  if (state.isFirebaseActive && state.db) {
    try {
      const itemRef = doc(state.db, 'shopping_lists', state.currentListId, 'items', itemId);
      await updateDoc(itemRef, {
        purchased: purchased,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  } else {
    const item = state.items.find(i => i.id === itemId);
    if (item) {
      item.purchased = purchased;
      saveLocalItems();
      renderAll();
    }
  }
}

// Incremento/Decremento rápido de quantidade no card
async function stepItemQuantity(itemId, step) {
  const item = state.items.find(i => i.id === itemId);
  if (!item) return;

  let currentQty = parseFloat(item.qty) || 1;
  let newQty = currentQty + step;
  if (newQty <= 0) newQty = 1;

  if (state.isFirebaseActive && state.db) {
    try {
      const itemRef = doc(state.db, 'shopping_lists', state.currentListId, 'items', itemId);
      await updateDoc(itemRef, {
        qty: newQty,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Erro ao alterar quantidade:", err);
    }
  } else {
    item.qty = newQty;
    saveLocalItems();
    renderAll();
  }
}

// Excluir item
async function deleteItem(itemId) {
  if (state.isFirebaseActive && state.db) {
    try {
      const itemRef = doc(state.db, 'shopping_lists', state.currentListId, 'items', itemId);
      await deleteDoc(itemRef);
      showToast("Produto removido.");
    } catch (err) {
      console.error("Erro ao excluir item:", err);
      showToast("Erro ao excluir no Firebase.", "error");
    }
  } else {
    state.items = state.items.filter(i => i.id !== itemId);
    saveLocalItems();
    renderAll();
    showToast("Produto removido.");
  }
}

// Limpar todos os itens comprados
async function clearCompletedItems() {
  const completed = state.items.filter(i => i.purchased);
  if (completed.length === 0) {
    showToast("Nenhum item comprado para excluir.");
    return;
  }

  if (!confirm(`Deseja excluir ${completed.length} produtos comprados da lista?`)) return;

  if (state.isFirebaseActive && state.db) {
    try {
      const batch = writeBatch(state.db);
      completed.forEach(item => {
        const ref = doc(state.db, 'shopping_lists', state.currentListId, 'items', item.id);
        batch.delete(ref);
      });
      await batch.commit();
      showToast(`${completed.length} itens comprados foram removidos.`);
    } catch (err) {
      console.error("Erro no batch delete:", err);
      showToast("Erro ao excluir itens no Firebase.", "error");
    }
  } else {
    state.items = state.items.filter(i => !i.purchased);
    saveLocalItems();
    renderAll();
    showToast(`${completed.length} itens comprados foram removidos.`);
  }
}

// Desmarcar todos os itens comprados
async function uncheckAllItems() {
  const completed = state.items.filter(i => i.purchased);
  if (completed.length === 0) return;

  if (state.isFirebaseActive && state.db) {
    try {
      const batch = writeBatch(state.db);
      completed.forEach(item => {
        const ref = doc(state.db, 'shopping_lists', state.currentListId, 'items', item.id);
        batch.update(ref, { purchased: false, updatedAt: serverTimestamp() });
      });
      await batch.commit();
      showToast("Todos os itens foram desmarcados.");
    } catch (err) {
      console.error("Erro no batch update:", err);
    }
  } else {
    completed.forEach(i => i.purchased = false);
    saveLocalItems();
    renderAll();
    showToast("Todos os itens foram desmarcados.");
  }
}

// ================= MODAL DE EDIÇÃO =================
function openEditModal(item) {
  document.getElementById('editItemId').value = item.id;
  document.getElementById('editItemName').value = item.name;
  document.getElementById('editItemQty').value = item.qty;
  document.getElementById('editItemUnit').value = item.unit || 'un';
  document.getElementById('editItemPrice').value = item.price > 0 ? item.price : '';
  document.getElementById('editItemCategory').value = item.categoryId || 'outros';

  document.getElementById('modalEditItem').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('modalEditItem').classList.add('hidden');
}

async function handleSaveEdit(e) {
  e.preventDefault();
  const id = document.getElementById('editItemId').value;
  const name = document.getElementById('editItemName').value.trim();
  const qty = parseFloat(document.getElementById('editItemQty').value) || 1;
  const unit = document.getElementById('editItemUnit').value;
  const price = parseFloat(document.getElementById('editItemPrice').value) || 0;
  const catId = document.getElementById('editItemCategory').value;
  const cat = CATEGORIES.find(c => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];

  if (!name) return;

  const updatedData = {
    name,
    qty,
    unit,
    price,
    categoryId: cat.id,
    categoryName: cat.name,
    categoryEmoji: cat.emoji
  };

  if (state.isFirebaseActive && state.db) {
    try {
      const ref = doc(state.db, 'shopping_lists', state.currentListId, 'items', id);
      await updateDoc(ref, {
        ...updatedData,
        updatedAt: serverTimestamp()
      });
      showToast("Produto atualizado!");
    } catch (err) {
      console.error("Erro ao salvar edição:", err);
      showToast("Erro ao atualizar no Firebase.", "error");
    }
  } else {
    const item = state.items.find(i => i.id === id);
    if (item) {
      Object.assign(item, updatedData);
      saveLocalItems();
      renderAll();
      showToast("Produto atualizado!");
    }
  }

  closeEditModal();
}

// ================= CATEGORIAS & DETECÇÃO INTELIGENTE =================
function renderCategoryChips() {
  const container = document.getElementById('categoryChipsContainer');
  if (!container) return;

  container.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.dataset.id = cat.id;
    chip.className = `category-chip shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border transition-all ${
      state.selectedCategory?.id === cat.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
    }`;
    chip.innerHTML = `<span>${cat.emoji}</span><span>${cat.name}</span>`;
    chip.addEventListener('click', () => {
      state.selectedCategory = cat;
      updateCategoryPreview();
      updateCategoryChipsHighlight();
    });
    container.appendChild(chip);
  });
}

function updateCategoryChipsHighlight() {
  document.querySelectorAll('.category-chip').forEach(chip => {
    const isSelected = chip.dataset.id === state.selectedCategory?.id;
    chip.className = `category-chip shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border transition-all ${
      isSelected ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
    }`;
  });
}

function renderCategorySelectOptions() {
  const select = document.getElementById('editItemCategory');
  if (!select) return;
  select.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.emoji} ${cat.name}`;
    select.appendChild(opt);
  });
}

function updateCategoryPreview() {
  const emojiPreview = document.getElementById('selectedEmojiPreview');
  if (emojiPreview && state.selectedCategory) {
    emojiPreview.textContent = state.selectedCategory.emoji;
  }
}

// Ao digitar o nome do produto, detecta automaticamente a categoria e emoji correspondente
function handleNameInputAutoDetect(e) {
  const val = e.target.value.trim();
  const badgeHint = document.getElementById('categoryBadgeHint');

  if (val.length >= 2) {
    const detected = detectCategory(val);
    state.selectedCategory = detected;
    updateCategoryPreview();
    updateCategoryChipsHighlight();

    if (badgeHint) {
      badgeHint.textContent = `${detected.emoji} ${detected.name}`;
      badgeHint.classList.remove('hidden');
    }
  } else {
    if (badgeHint) badgeHint.classList.add('hidden');
  }
}

// ================= COMPARTILHAMENTO & QR CODE =================
function updateShareModalData() {
  const fullUrl = `${window.location.origin}${window.location.pathname}?lista=${encodeURIComponent(state.currentListId)}`;
  
  const shareInput = document.getElementById('shareUrlInput');
  if (shareInput) shareInput.value = fullUrl;

  const customInput = document.getElementById('inputCustomListId');
  if (customInput) customInput.value = state.currentListId;

  // Gera o QR Code com QRious
  try {
    const qrCanvas = document.getElementById('qrCodeCanvas');
    if (qrCanvas && window.QRious) {
      new QRious({
        element: qrCanvas,
        value: fullUrl,
        size: 160,
        level: 'M',
        foreground: '#0f172a'
      });
    }
  } catch (e) {
    console.warn("QRious não carregado:", e);
  }
}

function copyShareUrl() {
  const shareInput = document.getElementById('shareUrlInput');
  if (!shareInput) return;

  navigator.clipboard.writeText(shareInput.value)
    .then(() => {
      showToast("Link copiado! Envie para sua esposa pelo WhatsApp 📲", "success");
    })
    .catch(() => {
      shareInput.select();
      document.execCommand('copy');
      showToast("Link copiado!", "success");
    });
}

function switchToList(newListId) {
  const cleaned = cleanListId(newListId);
  if (!cleaned) return;

  const newUrl = `${window.location.origin}${window.location.pathname}?lista=${encodeURIComponent(cleaned)}`;
  window.history.pushState({ listId: cleaned }, '', newUrl);

  state.currentListId = cleaned;
  localStorage.setItem('lista_compras_last_list', cleaned);
  updateListHeaderUI();
  updateShareModalData();
  initFirebaseOrLocal();
  document.getElementById('modalShare').classList.add('hidden');
  showToast(`Lista alterada para: ${cleaned}`);
}

// ================= CONFIGURAÇÃO DO FIREBASE (MODAL) =================
function openSettingsModal() {
  const config = getStoredFirebaseConfig() || {};
  document.getElementById('cfgApiKey').value = config.apiKey || '';
  document.getElementById('cfgProjectId').value = config.projectId || '';
  document.getElementById('cfgAuthDomain').value = config.authDomain || '';
  document.getElementById('cfgAppId').value = config.appId || '';
  document.getElementById('cfgStorageBucket').value = config.storageBucket || '';

  document.getElementById('modalSettings').classList.remove('hidden');
}

function handleParseFirebaseJson() {
  const textarea = document.getElementById('textareaFirebaseJson');
  const text = textarea.value;
  if (!text.trim()) return;

  try {
    // Tenta encontrar pares chave: valor
    const extract = (key) => {
      const match = text.match(new RegExp(`${key}["']?\\s*:\\s*["']([^"']+)["']`));
      return match ? match[1] : '';
    };

    const apiKey = extract('apiKey');
    const projectId = extract('projectId');
    const authDomain = extract('authDomain');
    const appId = extract('appId');
    const storageBucket = extract('storageBucket');

    if (apiKey) document.getElementById('cfgApiKey').value = apiKey;
    if (projectId) document.getElementById('cfgProjectId').value = projectId;
    if (authDomain) document.getElementById('cfgAuthDomain').value = authDomain;
    if (appId) document.getElementById('cfgAppId').value = appId;
    if (storageBucket) document.getElementById('cfgStorageBucket').value = storageBucket;

    showToast("Campos preenchidos com sucesso!");
  } catch (err) {
    showToast("Não foi possível extrair os dados. Preencha manualmente.", "error");
  }
}

function handleSaveFirebaseConfig() {
  const apiKey = document.getElementById('cfgApiKey').value.trim();
  const projectId = document.getElementById('cfgProjectId').value.trim();
  const authDomain = document.getElementById('cfgAuthDomain').value.trim();
  const appId = document.getElementById('cfgAppId').value.trim();
  const storageBucket = document.getElementById('cfgStorageBucket').value.trim();

  if (!apiKey || !projectId) {
    alert("apiKey e projectId são obrigatórios para conectar ao Firebase!");
    return;
  }

  const config = {
    apiKey,
    projectId,
    authDomain,
    appId,
    storageBucket
  };

  saveFirebaseConfig(config);
  document.getElementById('modalSettings').classList.add('hidden');
  showToast("Configuração salva! Conectando à nuvem...", "success");

  // Reinicializa conexão
  initFirebaseOrLocal();
}

function handleClearFirebaseConfig() {
  if (confirm("Deseja remover as credenciais do Firebase salvas no navegador?")) {
    clearFirebaseConfig();
    document.getElementById('modalSettings').classList.add('hidden');
    initFirebaseOrLocal();
    showToast("Configuração removida. Modo local ativado.");
  }
}

// ================= EVENT LISTENERS =================
function setupEventListeners() {
  // Formulário Adicionar Item
  const addForm = document.getElementById('addItemForm');
  addForm.addEventListener('submit', handleAddItem);

  // Stepper formulário principal
  document.getElementById('btnQtyMinus').addEventListener('click', () => {
    const input = document.getElementById('inputQty');
    let v = parseFloat(input.value) || 1;
    if (v > 1) input.value = v - 1;
  });
  document.getElementById('btnQtyPlus').addEventListener('click', () => {
    const input = document.getElementById('inputQty');
    let v = parseFloat(input.value) || 1;
    input.value = v + 1;
  });

  // Detecção automática ao digitar
  document.getElementById('inputItemName').addEventListener('input', handleNameInputAutoDetect);

  // Filtros de Abas
  document.querySelectorAll('[data-filter]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(t => {
        t.className = 'flex-1 py-1.5 rounded-lg text-center transition-all hover:text-slate-900';
      });
      tab.className = 'flex-1 py-1.5 rounded-lg text-center transition-all bg-white text-emerald-700 shadow-xs';
      state.filter = tab.dataset.filter;
      renderItemsList();
      refreshLucide();
    });
  });

  // Busca em tempo real
  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderItemsList();
    refreshLucide();
  });

  // Dropdown Extra Ações
  const btnExtraMenu = document.getElementById('btnExtraMenu');
  const dropdown = document.getElementById('extraMenuDropdown');
  btnExtraMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });
  document.addEventListener('click', () => {
    dropdown.classList.add('hidden');
  });

  document.getElementById('btnClearCompleted').addEventListener('click', () => {
    dropdown.classList.add('hidden');
    clearCompletedItems();
  });
  document.getElementById('btnUncheckAll').addEventListener('click', () => {
    dropdown.classList.add('hidden');
    uncheckAllItems();
  });

  // Acordeom de Comprados
  document.getElementById('togglePurchasedSection').addEventListener('click', () => {
    const list = document.getElementById('purchasedList');
    const chevron = document.getElementById('chevronPurchased');
    const isHidden = list.classList.toggle('hidden');
    chevron.style.transform = isHidden ? 'rotate(-90deg)' : 'rotate(0deg)';
  });

  // Modal Compartilhar
  document.getElementById('btnOpenShare').addEventListener('click', () => {
    updateShareModalData();
    document.getElementById('modalShare').classList.remove('hidden');
  });
  document.getElementById('btnCloseShare').addEventListener('click', () => {
    document.getElementById('modalShare').classList.add('hidden');
  });
  document.getElementById('btnCopyShareUrl').addEventListener('click', copyShareUrl);
  document.getElementById('btnSwitchToCustomList').addEventListener('click', () => {
    const val = document.getElementById('inputCustomListId').value.trim();
    if (val) switchToList(val);
  });
  document.getElementById('btnSwitchList').addEventListener('click', () => {
    updateShareModalData();
    document.getElementById('modalShare').classList.remove('hidden');
  });

  // Modal Configurações
  document.getElementById('btnOpenSettings').addEventListener('click', openSettingsModal);
  document.getElementById('btnConfigNow').addEventListener('click', openSettingsModal);
  document.getElementById('btnCloseSettings').addEventListener('click', () => {
    document.getElementById('modalSettings').classList.add('hidden');
  });
  document.getElementById('btnParseConfig').addEventListener('click', handleParseFirebaseJson);
  document.getElementById('btnSaveConfig').addEventListener('click', handleSaveFirebaseConfig);
  document.getElementById('btnClearConfig').addEventListener('click', handleClearFirebaseConfig);

  // Modal Edição
  document.getElementById('btnCloseEdit').addEventListener('click', closeEditModal);
  document.getElementById('btnCancelEdit').addEventListener('click', closeEditModal);
  document.getElementById('editItemForm').addEventListener('submit', handleSaveEdit);
}

// ================= UTILITÁRIOS =================
let toastTimeout;
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const msgSpan = document.getElementById('toastMessage');
  const iconSpan = document.getElementById('toastIcon');

  if (!toast) return;

  msgSpan.textContent = message;
  iconSpan.textContent = type === 'error' ? '❌' : type === 'success' ? '✅' : '✨';

  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

function refreshLucide() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
