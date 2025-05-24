# 🔐 Demonstração de Autenticação Google + ERC-4337

Uma aplicação educativa que demonstra como integrar login social (Google) com carteiras inteligentes usando o padrão ERC-4337 (Account Abstraction).

## 📚 O que é esta aplicação?

Esta é uma demonstração didática que mostra como:
- ✅ Autenticar usuários com login do Google
- ✅ Gerar automaticamente endereços de carteira inteligente (ERC-4337) 
- ✅ Armazenar a associação entre email e endereço da carteira
- ✅ Usar Account Abstraction para melhorar a UX Web3

> **⚠️ AVISO IMPORTANTE**: Esta aplicação foi criada apenas para fins educacionais e não é adequada para ambiente de produção. Use por sua própria conta e risco.

## 📖 Documentação Completa

Esta aplicação possui documentação detalhada e didática. Recomendamos fortemente que você leia os seguintes documentos:

### 🚀 Guias Essenciais

1. **[📋 Guia de Configuração Completo](docs/SETUP-GUIDE.md)**
   - Passo a passo detalhado para configurar tudo
   - Configuração do Google OAuth
   - Configuração do Stackup (Bundler ERC-4337)
   - Solução de problemas comuns

2. **[🔐 ERC-4337 Explicado](docs/ERC4337-EXPLICACAO.md)**
   - O que é Account Abstraction
   - Como funciona o ERC-4337
   - Comparação com carteiras tradicionais
   - Vantagens e casos de uso

3. **[🚀 Exemplos de Extensões](docs/EXTENSOES-EXEMPLO.md)**
   - Como adicionar transferências
   - Patrocínio de gas (Paymaster)
   - Transações em lote
   - Recuperação social
   - Interface melhorada

### 📁 Código Documentado

Todos os arquivos principais possuem comentários detalhados e explicativos:

- **`client/src/App.tsx`** - Componente React principal
- **`server/server.ts`** - API Express backend  
- **`client/src/getSimpleAccount.ts`** - Integração ERC-4337

## 🏗️ Arquitetura da Aplicação

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Frontend      │◄──►│   Backend       │◄──►│   Blockchain    │
│   (React)       │    │   (Express)     │    │   (Polygon)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
    Google Auth            NeDB Database         ERC-4337 Smart
    JWT Tokens            (accounts.db)          Contract Wallets
```

### Componentes Principais

1. **Frontend (Cliente React)**
   - Interface para login com Google
   - Geração de carteiras ERC-4337
   - Comunicação com o backend
   - Tecnologias: React, TypeScript, TailwindCSS, Ethers.js

2. **Backend (Servidor Express)**
   - API REST para gerenciar contas
   - Banco de dados simples (NeDB)
   - Associação email ↔ endereço de carteira
   - Tecnologias: Node.js, Express, TypeScript, NeDB

3. **Blockchain Integration**
   - ERC-4337 Account Abstraction
   - Smart Contract Wallets
   - Rede: Polygon Mumbai (testnet)

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Interface de usuário
- **TypeScript** - Tipagem estática
- **Ethers.js 5** - Interação com blockchain
- **TailwindCSS** - Estilização
- **Google Sign-In** - Autenticação social
- **JWT Decode** - Decodificação de tokens
- **Account Abstraction SDK** - ERC-4337

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **NeDB** - Banco de dados embarcado
- **CORS** - Cross-Origin Resource Sharing

### Blockchain
- **ERC-4337** - Padrão de Account Abstraction
- **Polygon Mumbai** - Rede de teste
- **EntryPoint Contract** - Processamento de UserOperations
- **SimpleAccountFactory** - Criação de carteiras

## 📋 Pré-requisitos

Antes de executar esta aplicação, certifique-se de ter:

- **Node.js** (versão 16 ou superior)
- **npm** ou **yarn**
- **Conta Google Developer** (para obter Client ID)
- **Chave API Stackup** (para bundler ERC-4337)
- **Conhecimento básico** de React, blockchain e carteiras

## 🚀 Início Rápido

### Para uma configuração completa e detalhada, siga o [📋 Guia de Configuração](docs/SETUP-GUIDE.md)

```bash
# 1. Clone o repositório
git clone <seu-repositorio>
cd example-login-erc4337

# 2. Configure o servidor
cd server
npm install --registry=https://registry.npmjs.org/
npm run dev

# 3. Configure o cliente (novo terminal)
cd ../client
npm install --registry=https://registry.npmjs.org/

# 4. Configure as credenciais (veja o guia detalhado)
# - Google Client ID em src/App.tsx
# - Stackup API Key em src/config.json

# 5. Execute o frontend
npm run start
```

## 🧪 Testando a Aplicação

1. **Acesse** `http://localhost:3000`
2. **Clique** em "Continue with Google"
3. **Faça login** com sua conta Google
4. **Observe** que um endereço de carteira foi gerado automaticamente
5. **Faça logout e login novamente** - o mesmo endereço será recuperado

### O que você deve ver:

```
✅ Botão de login do Google
✅ Após login: Email do usuário
✅ Endereço da carteira ERC-4337 (ex: 0x742d35Cc6cd...)
✅ Botão de logout
```

## 🔍 Como Funciona?

### Fluxo de Autenticação

1. **Login com Google**:
   ```
   Usuário clica em "Continue with Google"
   ↓
   Google retorna JWT token
   ↓
   Frontend decodifica o token e extrai o email
   ```

2. **Geração de Carteira**:
   ```
   Frontend gera uma chave privada aleatória
   ↓
   Usa Account Abstraction SDK para calcular endereço
   ↓
   Endereço é determinístico baseado na chave privada
   ```

3. **Armazenamento**:
   ```
   Frontend envia email + endereço para o backend
   ↓
   Backend verifica se email já existe
   ↓
   Se não existe, cria novo registro no banco
   ↓
   Retorna dados da conta para o frontend
   ```

### Estrutura de Dados

```typescript
interface User {
  email: string;    // Email do Google OAuth
  address: string;  // Endereço da carteira ERC-4337
}
```

### ERC-4337 Account Abstraction

A aplicação usa o padrão ERC-4337 que permite:

- **Carteiras sem chaves privadas expostas**: O usuário não precisa gerenciar chaves
- **Patrocínio de gas**: Possibilidade de pagar gas com tokens ERC-20
- **Operações em lote**: Múltiplas transações em uma única operação
- **Recuperação social**: Recuperação de conta via métodos sociais

#### Contratos Utilizados

```
EntryPoint: 0x1306b01bC3e4AD202612D3843387e94737673F53
└── Processa todas as UserOperations
    
SimpleAccountFactory: 0xc99963686CB64e3B98DF7E877318D02D85DFE326
└── Cria novas carteiras inteligentes
```

## 📁 Estrutura do Projeto

```
example-login-erc4337/
├── 📁 client/                    # Frontend React
│   ├── 📁 public/               # Arquivos públicos
│   ├── 📁 src/                  # Código fonte
│   │   ├── App.tsx              # Componente principal
│   │   ├── config.json          # Configurações blockchain
│   │   ├── getSimpleAccount.ts  # Account Abstraction
│   │   └── getAddress.ts        # Utilitários de endereço
│   ├── package.json             # Dependências frontend
│   └── config-overrides.js      # Configurações Webpack
├── 📁 server/                   # Backend Express
│   ├── server.ts                # Servidor principal
│   ├── accounts.db              # Banco de dados NeDB
│   └── package.json             # Dependências backend
├── 📁 docs/                     # Documentação detalhada
│   ├── SETUP-GUIDE.md           # Guia de configuração
│   ├── ERC4337-EXPLICACAO.md    # Explicação do ERC-4337
│   └── EXTENSOES-EXEMPLO.md     # Exemplos de extensões
├── README.md                    # Esta documentação
└── .gitignore                   # Arquivos ignorados pelo Git
```

## 🧩 Principais Funções

### Frontend (`client/src/App.tsx`)

```typescript
// Função de login
window.handleCredentialResponse = (response: any) => {
  var userObject = jwt_decode(response.credential as any);
  setUser(userObject as any);
};

// Função de logout
function handleSignOut() {
  setUser(emptyUser);
  setBackendData(emptyUser);
}

// Geração de endereço ERC-4337
async function getAddress(potentialWallet: ethers.Wallet) {
  const accountAPI = getSimpleAccount(
    provider,
    potentialWallet.privateKey,
    config.entryPoint,
    config.simpleAccountFactory
  );
  return await accountAPI.getCounterFactualAddress();
}
```

### Backend (`server/server.ts`)

```typescript
// Endpoint principal
app.post("/return-account", async (req, res) => {
  const { email, address } = req.body;
  
  if (!(await emailExists(email))) {
    createAccount(email, address);
  }
  
  let account = await getAccountByEmail(email);
  res.send(account);
});
```

## 🔧 Personalização e Extensões

### Adicionando Novas Funcionalidades

1. **Transações**:
   ```typescript
   // Adicione em getSimpleAccount.ts
   async function sendTransaction(to: string, value: string) {
     const userOp = await accountAPI.createSignedUserOp({
       target: to,
       data: "0x",
       value: ethers.utils.parseEther(value)
     });
     
     return await accountAPI.httpRpcClient.sendUserOpToBundler(userOp);
   }
   ```

2. **Multiplas Redes**:
   ```json
   // config.json
   {
     "networks": {
       "mumbai": {
         "rpcUrl": "https://rpc-mumbai.maticvigil.com/",
         "entryPoint": "0x1306b01bC3e4AD202612D3843387e94737673F53"
       },
       "goerli": {
         "rpcUrl": "https://goerli.infura.io/v3/YOUR_KEY",
         "entryPoint": "0x1306b01bC3e4AD202612D3843387e94737673F53"
       }
     }
   }
   ```

3. **Outros Provedores OAuth**:
   ```typescript
   // Adicione suporte para Discord, Twitter, etc.
   const providers = {
     google: { clientId: "...", scope: "email profile" },
     discord: { clientId: "...", scope: "identify email" }
   };
   ```

## ⚠️ Limitações e Considerações

### Segurança
- 🔒 **Chaves privadas**: São geradas no cliente e não são persistidas
- 🔒 **JWT**: Tokens não são validados no backend (apenas demo)
- 🔒 **HTTPS**: Use HTTPS em produção
- 🔒 **Rate limiting**: Adicione limitação de taxa em produção

### Performance
- 📊 **Banco de dados**: NeDB é adequado apenas para desenvolvimento
- 📊 **Escalabilidade**: Um usuário por vez (sem concurrent access)
- 📊 **Rede**: Dependente da velocidade da rede Polygon

### Funcionalidades Ausentes
- ❌ Recuperação de chave privada
- ❌ Backup da carteira
- ❌ Histórico de transações
- ❌ Suporte a múltiplas carteiras por usuário
- ❌ Interface para enviar transações

## 🚨 Problemas Comuns e Soluções

### Erro: "Google Sign-In não carrega"
```bash
Solução: Verifique se o Client ID está correto e o domínio está autorizado
```

### Erro: "Failed to fetch bundler"
```bash
Solução: Verifique se a chave da API Stackup está correta no config.json
```

### Erro: "CORS Error"
```bash
Solução: Certifique-se de que o servidor está rodando na porta 3001
```

### Erro: "Cannot read properties of undefined"
```bash
Solução: Aguarde o servidor inicializar completamente antes de testar
```

## 📈 Próximos Passos

Para tornar esta aplicação mais robusta:

1. **Implementar persistência de chaves privadas** (com criptografia)
2. **Adicionar interface para transações**
3. **Integrar com carteiras existentes** (MetaMask, WalletConnect)
4. **Adicionar testes automatizados**
5. **Implementar logging e monitoramento**
6. **Usar banco de dados robusto** (PostgreSQL, MongoDB)
7. **Adicionar autenticação JWT adequada**
8. **Implementar recuperação social de contas**

## 📞 Suporte e Contribuição

Este projeto é educacional e open-source. Sinta-se livre para:

- 🐛 Reportar bugs
- 💡 Sugerir melhorias
- 🔧 Contribuir com código
- 📚 Melhorar a documentação

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

---

**Criado para fins educacionais** • **Não use em produção** • **Always DYOR** 🚀
