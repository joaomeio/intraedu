// app.js – Lógica principal do IntraEdu

// Imports do Firebase usando o SDK modular via CDN.
import {
  initializeApp
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// TODO: Substitua pelos dados do seu projeto Firebase
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos da DOM
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const toggleLogin = document.getElementById('toggle-login');
const toggleSignup = document.getElementById('toggle-signup');

const signupBtn = document.getElementById('signup-btn');
const signupName = document.getElementById('signup-name');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');

const loginBtn = document.getElementById('login-btn');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');

const usersList = document.getElementById('users-list');
const chatHeader = document.getElementById('chat-header');
const chatMessages = document.getElementById('chat-messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const currentUserNameEl = document.getElementById('current-user-name');
const logoutBtn = document.getElementById('logout-btn');

// Estado global
let selectedUser = null;
let unsubscribeMessages = null;

// Alternância entre formulários de cadastro e login
toggleLogin.addEventListener('click', (e) => {
  e.preventDefault();
  signupForm.style.display = 'none';
  loginForm.style.display = 'block';
});

toggleSignup.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.style.display = 'none';
  signupForm.style.display = 'block';
});

// Cadastro de usuário
signupBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const name = signupName.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value;
  if (!name || !email || !password) {
    alert('Preencha todos os campos.');
    return;
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Atualiza o perfil com o nome
    await updateProfile(cred.user, { displayName: name });
    // Cria o documento do usuário na coleção users
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      name: name,
      email: email,
      createdAt: serverTimestamp()
    });
    // Limpa campos
    signupName.value = '';
    signupEmail.value = '';
    signupPassword.value = '';
  } catch (error) {
    console.error(error);
    alert('Erro ao registrar: ' + (error.message || error));
  }
});

// Login de usuário
loginBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  if (!email || !password) {
    alert('Preencha todos os campos.');
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginEmail.value = '';
    loginPassword.value = '';
  } catch (error) {
    console.error(error);
    alert('Erro ao entrar: ' + (error.message || error));
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error(error);
  }
});

// Observador de estado de autenticação
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Usuário logado
    authContainer.style.display = 'none';
    appContainer.style.display = 'flex';
    currentUserNameEl.textContent = user.displayName || user.email;
    loadUsers();
  } else {
    // Usuário deslogado
    appContainer.style.display = 'none';
    authContainer.style.display = 'block';
    // Limpa lista e chat
    usersList.innerHTML = '';
    chatHeader.textContent = '';
    chatMessages.innerHTML = '';
    messageForm.style.display = 'none';
    selectedUser = null;
    if (unsubscribeMessages) unsubscribeMessages();
  }
});

// Carrega a lista de usuários (exceto o atual)
function loadUsers() {
  const currentUser = auth.currentUser;
  const usersRef = collection(db, 'users');
  // Consulta usuários que não sejam o atual
  const q = query(usersRef, where('uid', '!=', currentUser.uid), orderBy('name'));
  onSnapshot(q, (snapshot) => {
    usersList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const userData = docSnap.data();
      const li = document.createElement('li');
      li.textContent = userData.name || userData.email;
      li.dataset.uid = userData.uid;
      li.addEventListener('click', () => selectChat(userData));
      if (selectedUser && selectedUser.uid === userData.uid) {
        li.classList.add('active');
      }
      usersList.appendChild(li);
    });
  });
}

// Seleciona um usuário para conversar
function selectChat(userData) {
  if (selectedUser && selectedUser.uid === userData.uid) return; // já selecionado
  selectedUser = userData;
  // Destaca seleção na lista
  const lis = usersList.querySelectorAll('li');
  lis.forEach((li) => {
    li.classList.toggle('active', li.dataset.uid === userData.uid);
  });
  // Atualiza cabeçalho
  chatHeader.textContent = userData.name || userData.email;
  messageForm.style.display = 'flex';
  messageInput.value = '';
  chatMessages.innerHTML = '';
  // Cancela ouvinte anterior se existir
  if (unsubscribeMessages) unsubscribeMessages();
  // Carrega mensagens para o canal entre usuários
  const currentUid = auth.currentUser.uid;
  const targetUid = userData.uid;
  // Define channelId como combinação ordenada de uids para garantir unicidade
  const channelId = [currentUid, targetUid].sort().join('_');
  const messagesRef = collection(db, 'messages');
  const mq = query(messagesRef, where('channelId', '==', channelId), orderBy('createdAt'));
  unsubscribeMessages = onSnapshot(mq, (snapshot) => {
    chatMessages.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const msg = docSnap.data();
      const div = document.createElement('div');
      div.classList.add('message');
      div.classList.add(msg.from === currentUid ? 'sent' : 'received');
      div.textContent = msg.text;
      // Meta com horário (opcional)
      const timeDiv = document.createElement('div');
      timeDiv.classList.add('meta');
      if (msg.createdAt && msg.createdAt.toDate) {
        const date = msg.createdAt.toDate();
        timeDiv.textContent = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
      div.appendChild(timeDiv);
      chatMessages.appendChild(div);
      // Scroll para o fundo
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  });
}

// Envio de mensagem
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !selectedUser) return;
  const currentUid = auth.currentUser.uid;
  const targetUid = selectedUser.uid;
  const channelId = [currentUid, targetUid].sort().join('_');
  try {
    await addDoc(collection(db, 'messages'), {
      text: text,
      from: currentUid,
      to: targetUid,
      channelId: channelId,
      createdAt: serverTimestamp()
    });
    messageInput.value = '';
  } catch (error) {
    console.error(error);
    alert('Erro ao enviar mensagem: ' + (error.message || error));
  }
}
