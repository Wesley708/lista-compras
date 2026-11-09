# 🛒 Lista de Compras Colaborativa em Tempo Real

Aplicativo web mobile-first de lista de compras colaborativa com cálculo financeiro automático, ícones/emojis inteligentes por categoria e sincronização em tempo real na nuvem utilizando o **Google Firebase Firestore (100% Gratuito)**.

O projeto é **100% estático** (Frontend puro em HTML5, JavaScript ES6 Modular e Tailwind CSS), podendo ser hospedado gratuitamente no **GitHub Pages**, **Vercel**, **Netlify** ou testado diretamente no seu computador com um simples comando Python.

---

## ✨ Funcionalidades Principais

1. **🔗 Link Compartilhado Instantâneo**:
   - Você e sua esposa acessam exatamente a mesma lista através de uma URL amigável (`?lista=nossa-casa`).
   - Gerador de **QR Code integrado**: mostre a tela do seu celular e a sua esposa só precisa apontar a câmera para sincronizar.
   - Suporte para alternar entre diferentes listas (ex: *Supermercado*, *Feira*, *Churrasco*).

2. **⚡ Sincronização em Tempo Real**:
   - Integração com o **Firebase Firestore** via WebSockets reativos (`onSnapshot`).
   - Se você riscar ou adicionar um item no mercado, a tela do celular da sua esposa atualiza em menos de 1 segundo sem precisar recarregar a página.

3. **💰 Resumo Financeiro & Progresso**:
   - Cálculo automático do **Valor Total Estimado** da compra ($Quantidade \times Preço$).
   - Separação em tempo real:
     - 🛒 **No Carrinho (Já comprados)**: valor e quantidade acumulada.
     - ⏳ **A Comprar (Pendentes)**: saldo restante para fechar a conta.
   - Barra de progresso visual de conclusão da lista.

4. **🧠 Reconhecimento Inteligente de Emojis e Categorias**:
   - Ao digitar o nome do produto (ex: *"leite"*, *"banana"*, *"picanha"*, *"sabão"*, *"pão"*), o app detecta a categoria e seleciona o emoji correspondente automaticamente.
   - Mais de 10 categorias com suporte a unidades personalizadas (`un`, `kg`, `g`, `L`, `pct`, `cx`).

5. **📱 Mobile-First & PWA**:
   - Visual fluido similar a um app nativo iOS/Android.
   - Botões de quantidade rápida `[-]` `[+]` direto no card.
   - Seção de "Já Comprados" colapsável para manter a lista limpa enquanto faz as compras.
   - Pode ser adicionado à tela inicial do celular como um aplicativo independente (PWA).

---

## 🚀 Como Rodar e Testar Localmente no Ubuntu

Você não precisa instalar Node.js ou npm! Como o Python 3 já está instalado no seu sistema:

```bash
# 1. Acesse a pasta do projeto
cd lista-compras

# 2. Inicie o servidor HTTP local
python3 -m http.server 8000
```

Abra o navegador no seu Ubuntu e acesse:
👉 **`http://localhost:8000`**

---

## 🔥 Passo a Passo: Configurando o Firebase Firestore Gratuito

O Firebase oferece um plano gratuito vitalício (*Spark Plan*) que inclui até 50.000 leituras e 20.000 gravações por dia, o que é mais do que suficiente para o uso familiar diário.

### Passo 1: Criar o Projeto no Firebase
1. Acesse o [Console do Firebase](https://console.firebase.google.com/) com sua conta Google.
2. Clique em **"Adicionar projeto"** (ou "Criar um projeto").
3. Digite um nome (ex: `minha-lista-compras`) e clique em **Continuar**.
4. O Google Analytics é opcional (pode desmarcar) e clique em **Criar projeto**.

### Passo 2: Ativar o Banco de Dados Firestore
1. No menu lateral esquerdo, clique em **Criação** (Build) ➔ **Firestore Database**.
2. Clique no botão **"Criar banco de dados"**.
3. Escolha o local do servidor (pode ser `southamerica-east1` em São Paulo ou `us-central1`).
4. Em regras de segurança, selecione **"Iniciar no modo de teste"** (ou configure as regras abaixo) e clique em **Ativar**.

### Passo 3: Configurar as Regras de Acesso do Firestore
Na aba **Regras** (Rules) do Firestore Database, cole o seguinte código para permitir que você e sua esposa leiam e editem a lista compartilhada:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shopping_lists/{listId}/items/{itemId} {
      allow read, write: if true;
    }
  }
}
```
Clique em **Publicar**.

### Passo 4: Obter as Credenciais do Aplicativo Web
1. No menu lateral esquerdo, clique na engrenagem ⚙️ (Configurações do Projeto) ➔ **Geral**.
2. Role até a seção "Seus aplicativos" e clique no ícone Web **`</>`**.
3. Dê um apelido ao app (ex: `web-lista`) e clique em **Registrar app**.
4. Você verá um bloco de código parecido com este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "minha-lista-compras.firebaseapp.com",
  projectId: "minha-lista-compras",
  storageBucket: "minha-lista-compras.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcd1234efgh"
};
```

### Passo 5: Inserir as Credenciais no Aplicativo
Você tem **duas formas fáceis** de aplicar essas credenciais:

- **Forma 1 (Pela Interface - Mais Rápida)**:
  Abra o aplicativo no navegador, clique no ícone de engrenagem **⚙️** no canto superior direito, cole o bloco de código acima e clique em **Salvar e Conectar**.
- **Forma 2 (No Arquivo de Código)**:
  Abra o arquivo `firebase-config.js` no seu editor e preencha o objeto `defaultFirebaseConfig` com os seus dados.

---

## 🌐 Como Publicar de Graça no GitHub Pages

1. Crie um repositório no seu GitHub (ex: `lista-de-compras`).
2. No terminal da sua máquina, envie os arquivos:
   ```bash
   cd lista-compras
   git init
   git add .
   git commit -m "feat: Lista de compras colaborativa com sincronização em tempo real"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/lista-de-compras.git
   git push -u origin main
   ```
3. No GitHub:
   - Vá em **Settings** ➔ **Pages** (no menu lateral).
   - Em **Build and deployment > Source**, selecione **Deploy from a branch**.
   - Em **Branch**, selecione `main` e a pasta `/(root)`.
   - Clique em **Save**.
4. Em 1 a 2 minutos, o GitHub gerará o link público do seu app:
   👉 `https://SEU_USUARIO.github.io/lista-de-compras/?lista=nossa-casa`

---

## 📲 Como Instalar no Celular (Adicionar à Tela de Início)

- **No iPhone (Safari)**:
  1. Abra o link da lista no Safari.
  2. Toque no botão de **Compartilhar** (ícone do quadrado com a seta para cima).
  3. Role para baixo e selecione **"Adicionar à Tela de Início"**.
- **No Android (Chrome)**:
  1. Abra o link da lista no Chrome.
  2. Toque no menu de **três pontos** (canto superior direito).
  3. Selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.

Pronto! Agora você e sua esposa têm um aplicativo colaborativo, sem custos de servidor e sempre sincronizado!
