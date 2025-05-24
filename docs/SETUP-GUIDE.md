# 🚀 Guia de Configuração Completo

Este guia vai te ajudar a configurar e executar a aplicação de demonstração do ERC-4337 passo a passo.

## 📋 Índice

1. [Pré-requisitos](#-pré-requisitos)
2. [Configuração do Google OAuth](#-configuração-do-google-oauth)
3. [Configuração do Stackup (Bundler)](#-configuração-do-stackup-bundler)
4. [Instalação e Execução](#-instalação-e-execução)
5. [Testes e Verificação](#-testes-e-verificação)
6. [Solução de Problemas](#-solução-de-problemas)

## 🛠️ Pré-requisitos

### Software Necessário

- **Node.js** (versão 16 ou superior)
  ```bash
  # Verificar versão
  node --version  # deve mostrar v16.x.x ou superior
  npm --version   # deve mostrar 8.x.x ou superior
  ```

- **Git** (para clonar o repositório)
  ```bash
  git --version  # qualquer versão recente
  ```

### Contas Necessárias

- **Conta Google** (para login social)
- **Conta Stackup** (para bundler ERC-4337)

## 🔐 Configuração do Google OAuth

### Passo 1: Acessar o Google Cloud Console

1. Acesse: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Faça login com sua conta Google

### Passo 2: Criar/Selecionar Projeto

#### Criar Novo Projeto:
```
1. Clique em "Select Project" no topo
2. Clique em "NEW PROJECT"
3. Nome: "ERC4337 Demo" (ou qualquer nome)
4. Clique em "CREATE"
```

#### Ou usar projeto existente:
```
1. Clique em "Select Project"
2. Escolha um projeto existente
```

### Passo 3: Ativar APIs Necessárias

```
1. No menu lateral, vá em "APIs & Services" > "Library"
2. Procure por "Google+ API"
3. Clique em "Google+ API"
4. Clique em "ENABLE"
```

### Passo 4: Criar Credenciais OAuth

```
1. Vá em "APIs & Services" > "Credentials"
2. Clique em "+ CREATE CREDENTIALS"
3. Selecione "OAuth client ID"
```

#### Configurar Tela de Consentimento (se necessário):
```
1. Se solicitado, clique em "CONFIGURE CONSENT SCREEN"
2. Escolha "External" (para teste)
3. Preencha:
   - App name: "ERC4337 Demo"
   - User support email: seu email
   - Developer contact: seu email
4. Clique em "SAVE AND CONTINUE"
5. Pule "Scopes" clicando "SAVE AND CONTINUE"
6. Pule "Test users" clicando "SAVE AND CONTINUE"
```

#### Criar OAuth Client ID:
```
1. Application type: "Web application"
2. Name: "ERC4337 Demo Client"
3. Authorized JavaScript origins:
   - http://localhost:3000
4. Authorized redirect URIs:
   - http://localhost:3000
5. Clique em "CREATE"
```

### Passo 5: Copiar Client ID

```
✅ IMPORTANTE: Copie o "Client ID" que aparece
Exemplo: 247332257621-abc123def456.apps.googleusercontent.com
```

## 🌐 Configuração do Stackup (Bundler)

### Passo 1: Criar Conta no Stackup

1. Acesse: [https://app.stackup.sh/](https://app.stackup.sh/)
2. Clique em "Sign Up"
3. Crie sua conta (email + senha)
4. Confirme o email

### Passo 2: Gerar API Key

```
1. Faça login no Stackup
2. Vá em "API Keys" no menu lateral
3. Clique em "Create API Key"
4. Nome: "ERC4337 Demo"
5. Network: "Polygon Mumbai"
6. Clique em "Create"
```

### Passo 3: Copiar API Key

```
✅ IMPORTANTE: Copie a API Key gerada
Exemplo: sk_live_abc123def456...
```

## 🚀 Instalação e Execução

### Passo 1: Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd example-login-erc4337
```

### Passo 2: Configurar o Backend

```bash
# Navegar para pasta do servidor
cd server

# Instalar dependências
npm install --registry=https://registry.npmjs.org/

# Iniciar servidor em modo desenvolvimento
npm run dev
```

**Resultado esperado:**
```
💾 Banco de dados NeDB inicializado (arquivo: accounts.db)
🚀 Servidor rodando na porta 3001
🌐 Frontend deve fazer requisições para: http://localhost:3001
📊 Banco de dados: ./accounts.db
✅ Servidor pronto para receber requisições!
```

### Passo 3: Configurar o Frontend

**Abra um novo terminal** (mantenha o servidor rodando):

```bash
# Navegar para pasta do cliente
cd client

# Instalar dependências
npm install --registry=https://registry.npmjs.org/
```

### Passo 4: Configurar Credenciais

#### 4.1 - Configurar Google Client ID

Edite o arquivo `client/src/App.tsx`:

```typescript
// Linha ~95, substitua:
data-client_id="SEU_GOOGLE_CLIENT_ID_AQUI"

// Por exemplo:
data-client_id="247332257621-abc123def456.apps.googleusercontent.com"
```

#### 4.2 - Configurar Stackup API Key

Edite o arquivo `client/src/config.json`:

```json
{
  "bundlerUrl": "https://api.stackup.sh/v1/node/SEU_API_KEY_AQUI",
  "rpcUrl": "https://rpc-mumbai.maticvigil.com/",
  "entryPoint": "0x1306b01bC3e4AD202612D3843387e94737673F53",
  "simpleAccountFactory": "0xc99963686CB64e3B98DF7E877318D02D85DFE326"
}
```

**Exemplo com API key real:**
```json
{
  "bundlerUrl": "https://api.stackup.sh/v1/node/sk_live_abc123def456...",
  "rpcUrl": "https://rpc-mumbai.maticvigil.com/",
  "entryPoint": "0x1306b01bC3e4AD202612D3843387e94737673F53",
  "simpleAccountFactory": "0xc99963686CB64e3B98DF7E877318D02D85DFE326"
}
```

### Passo 5: Iniciar o Frontend

```bash
# Na pasta client/
npm run start
```

**Resultado esperado:**
```
Compiled successfully!

You can now view try in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

## ✅ Testes e Verificação

### Verificar se Tudo Está Funcionando

1. **Abra o navegador**: [http://localhost:3000](http://localhost:3000)

2. **Você deve ver:**
   - Botão "Continue with Google"
   - Interface limpa e simples

3. **Teste o login:**
   - Clique em "Continue with Google"
   - Faça login com sua conta Google
   - Deve aparecer:
     - Seu email
     - Um endereço de carteira (0x...)
     - Botão "Sign out"

4. **Teste o logout/login novamente:**
   - Clique em "Sign out"
   - Faça login novamente
   - Deve mostrar o MESMO endereço de carteira

### Verificar Logs do Servidor

No terminal do servidor, você deve ver:

```
📡 Nova requisição recebida em /return-account
📧 Email: seu-email@gmail.com
🏠 Endereço: 0x742d35Cc6cd...
✨ seu-email@gmail.com não existe no banco. Criando nova conta...
✨ Criando nova conta para seu-email@gmail.com...
✅ Conta criada com sucesso: { email: '...', address: '...', _id: '...' }
📤 Enviando dados da conta: { email: '...', address: '...', _id: '...' }
```

## 🚨 Solução de Problemas

### Problema: Botão do Google não aparece

**Sintomas:**
- Página carrega mas não mostra botão de login
- Console mostra erros relacionados ao Google

**Soluções:**
1. Verificar se o Client ID está correto no `App.tsx`
2. Verificar se o domínio `http://localhost:3000` está autorizado no Google Console
3. Tentar limpar cache do navegador (Ctrl+Shift+R)

### Problema: Erro CORS

**Sintomas:**
```
Access to fetch at 'http://localhost:5000/return-account' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Soluções:**
1. Verificar se o servidor está rodando na porta correta (3001, não 5000)
2. Atualizar URL no frontend se necessário
3. Reiniciar o servidor

### Problema: "Failed to fetch bundler"

**Sintomas:**
- Login funciona mas erro no console sobre bundler
- Endereço não é gerado

**Soluções:**
1. Verificar se a API key do Stackup está correta no `config.json`
2. Verificar se a API key é para "Polygon Mumbai"
3. Verificar conexão com internet

### Problema: Servidor não inicia

**Sintomas:**
```
Error: Cannot find module 'express'
```

**Soluções:**
1. Verificar se você está na pasta `server/`
2. Executar `npm install` novamente
3. Verificar versão do Node.js (deve ser 16+)

### Problema: Frontend não compila

**Sintomas:**
```
Module not found: Can't resolve 'ethers'
```

**Soluções:**
1. Verificar se você está na pasta `client/`
2. Executar `npm install` novamente
3. Deletar `node_modules` e `package-lock.json`, depois `npm install`

## 🔧 Configurações Avançadas

### Usar Rede Diferente

Para usar Ethereum Goerli ao invés de Polygon Mumbai:

```json
// client/src/config.json
{
  "bundlerUrl": "https://api.stackup.sh/v1/node/SUA_API_KEY_GOERLI",
  "rpcUrl": "https://goerli.infura.io/v3/SEU_INFURA_KEY",
  "entryPoint": "0x1306b01bC3e4AD202612D3843387e94737673F53",
  "simpleAccountFactory": "0xc99963686CB64e3B98DF7E877318D02D85DFE326"
}
```

### Adicionar Logs Detalhados

No `client/src/App.tsx`, descomente ou adicione mais `console.log`:

```typescript
console.log("🔐 Usuário autenticado:", userObject);
console.log("🔑 Chave privada gerada:", potentialWallet.privateKey);
console.log("✅ Endereço calculado:", potentialAddress);
```

### Customizar Interface

Edite `client/src/App.css` para personalizar a aparência:

```css
.App-header {
  background-color: #1a1a2e;
  padding: 40px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
```

## 📞 Ainda Precisa de Ajuda?

### Recursos Úteis

- **Documentação Stackup**: [https://docs.stackup.sh/](https://docs.stackup.sh/)
- **Google OAuth Docs**: [https://developers.google.com/identity/sign-in/web](https://developers.google.com/identity/sign-in/web)
- **ERC-4337 Oficial**: [https://eips.ethereum.org/EIPS/eip-4337](https://eips.ethereum.org/EIPS/eip-4337)

### Debug Checklist

- [ ] Node.js versão 16+
- [ ] Ambos servidores rodando (frontend + backend)
- [ ] Google Client ID correto e domínio autorizado
- [ ] Stackup API key válida para Polygon Mumbai
- [ ] Console do navegador sem erros
- [ ] Rede estável

---

**🎉 Parabéns! Sua aplicação ERC-4337 está funcionando!** 