// firebase-config.js
// Aqui você pode colar diretamente as credenciais do seu projeto Firebase Console.
// Você também pode colar essas credenciais direto pela interface do aplicativo no botão de Configurações (⚙️)!

export const defaultFirebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const STORAGE_KEY = 'lista_compras_firebase_config';

// Obtém a configuração ativa (prioriza localStorage, depois arquivo estático)
export function getStoredFirebaseConfig() {
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (fromStorage) {
      const parsed = JSON.parse(fromStorage);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Erro ao ler config do Firebase do localStorage:", e);
  }

  // Verifica se o arquivo padrão foi preenchido
  if (defaultFirebaseConfig.apiKey && defaultFirebaseConfig.apiKey.trim() !== "") {
    return defaultFirebaseConfig;
  }

  return null;
}

// Salva a configuração no navegador (útil para configurar sem precisar mexer no código)
export function saveFirebaseConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error("Erro ao salvar config no localStorage:", e);
    return false;
  }
}

// Remove a configuração salva
export function clearFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
}
