# 🚀 Exemplos de Extensões da Aplicação

Este documento mostra como estender a aplicação básica com funcionalidades mais avançadas do ERC-4337.

## 📋 Índice

1. [Enviar Transações](#-enviar-transações)
2. [Patrocínio de Gas (Paymaster)](#-patrocínio-de-gas-paymaster)
3. [Transações em Lote](#-transações-em-lote)
4. [Recuperação Social](#-recuperação-social)
5. [Múltiplos Provedores OAuth](#-múltiplos-provedores-oauth)
6. [Interface Melhorada](#-interface-melhorada)

## 💸 Enviar Transações

### Adicionando Funcionalidade de Transferência

```typescript
// client/src/sendTransaction.ts
import { ethers } from "ethers";
import { getSimpleAccount } from "./getSimpleAccount";

/**
 * Envia uma transação usando ERC-4337
 */
export async function sendTransaction(
  privateKey: string,
  to: string,
  value: string, // Em ETH (ex: "0.01")
  provider: any,
  config: any
) {
  try {
    console.log("💸 Iniciando transação ERC-4337...");
    
    // 1. Configurar Account API
    const accountAPI = getSimpleAccount(
      provider,
      privateKey,
      config.entryPoint,
      config.simpleAccountFactory
    );

    // 2. Criar UserOperation
    const userOp = await accountAPI.createSignedUserOp({
      target: to,
      data: "0x", // Transferência simples sem dados
      value: ethers.utils.parseEther(value)
    });

    console.log("📋 UserOperation criada:", userOp);

    // 3. Enviar via Bundler
    const client = accountAPI.httpRpcClient;
    const userOpHash = await client.sendUserOpToBundler(userOp);
    
    console.log("🎁 UserOp enviada ao bundler:", userOpHash);

    // 4. Aguardar confirmação
    const receipt = await accountAPI.getUserOpReceipt(userOpHash);
    
    if (receipt) {
      console.log("✅ Transação confirmada:", receipt);
      return { success: true, txHash: receipt };
    } else {
      throw new Error("Transação não confirmada");
    }

  } catch (error) {
    console.error("❌ Erro na transação:", error);
    return { success: false, error };
  }
}
```

### Componente React para Transferências

```tsx
// client/src/TransferComponent.tsx
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { sendTransaction } from './sendTransaction';

interface TransferProps {
  userPrivateKey: string;
  config: any;
}

export function TransferComponent({ userPrivateKey, config }: TransferProps) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTransfer = async () => {
    if (!to || !amount) return;
    
    setLoading(true);
    setResult(null);

    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    const result = await sendTransaction(
      userPrivateKey,
      to,
      amount,
      provider,
      config
    );

    setResult(result);
    setLoading(false);
  };

  return (
    <div className="transfer-component">
      <h3>💸 Enviar Transação</h3>
      
      <div>
        <label>Para (endereço):</label>
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="0x742d35Cc6cd..."
        />
      </div>

      <div>
        <label>Valor (ETH):</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.01"
          type="number"
          step="0.001"
        />
      </div>

      <button 
        onClick={handleTransfer}
        disabled={loading || !to || !amount}
      >
        {loading ? "⏳ Enviando..." : "💸 Enviar"}
      </button>

      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          {result.success ? (
            <p>✅ Transação enviada: {result.txHash}</p>
          ) : (
            <p>❌ Erro: {result.error?.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

## 💳 Patrocínio de Gas (Paymaster)

### Configurando Paymaster

```typescript
// client/src/paymasterService.ts
import { PaymasterAPI } from "@account-abstraction/sdk";

/**
 * Paymaster que patrocina gas para usuários
 */
export class SponsoredPaymaster extends PaymasterAPI {
  private paymasterUrl: string;
  private sponsorApiKey: string;

  constructor(paymasterUrl: string, sponsorApiKey: string) {
    super();
    this.paymasterUrl = paymasterUrl;
    this.sponsorApiKey = sponsorApiKey;
  }

  async getPaymasterAndData(userOp: any): Promise<string> {
    try {
      // Chama API do paymaster para obter dados de patrocínio
      const response = await fetch(`${this.paymasterUrl}/sponsor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sponsorApiKey}`
        },
        body: JSON.stringify({
          userOperation: userOp,
          entryPoint: "0x1306b01bC3e4AD202612D3843387e94737673F53"
        })
      });

      const data = await response.json();
      
      if (data.paymasterAndData) {
        console.log("💳 Gas patrocinado pelo paymaster!");
        return data.paymasterAndData;
      }

      return "0x"; // Sem patrocínio, usuário paga
    } catch (error) {
      console.log("💸 Paymaster indisponível, usuário pagará gas");
      return "0x";
    }
  }
}

// Uso no getSimpleAccount.ts
export function getSimpleAccountWithPaymaster(
  provider: any,
  signingKey: string,
  entryPointAddress: string,
  factoryAddress: string,
  paymasterUrl?: string,
  sponsorApiKey?: string
) {
  const owner = new ethers.Wallet(signingKey, provider);
  
  const config: any = {
    provider,
    entryPointAddress,
    owner,
    factoryAddress,
  };

  // Adicionar paymaster se configurado
  if (paymasterUrl && sponsorApiKey) {
    config.paymasterAPI = new SponsoredPaymaster(paymasterUrl, sponsorApiKey);
  }

  return new SimpleAccountAPI(config);
}
```

## ⚡ Transações em Lote

### Executando Múltiplas Ações

```typescript
// client/src/batchOperations.ts
import { ethers } from "ethers";

/**
 * Executa múltiplas operações em uma única UserOperation
 */
export async function executeBatch(
  accountAPI: any,
  operations: Array<{
    to: string;
    value?: string;
    data?: string;
    description: string;
  }>
) {
  console.log(`⚡ Executando ${operations.length} operações em lote:`);
  operations.forEach((op, i) => {
    console.log(`  ${i + 1}. ${op.description}`);
  });

  try {
    // Preparar calls para execução em lote
    const calls = operations.map(op => ({
      target: op.to,
      value: op.value ? ethers.utils.parseEther(op.value) : 0,
      data: op.data || "0x"
    }));

    // Criar UserOperation para batch
    const userOp = await accountAPI.createSignedUserOp({
      target: accountAPI.getAccountAddress(), // Chama a própria smart wallet
      data: accountAPI.encodeBatch(calls)      // Encode das múltiplas operações
    });

    // Enviar
    const userOpHash = await accountAPI.httpRpcClient.sendUserOpToBundler(userOp);
    console.log("🎁 Batch enviado:", userOpHash);

    // Aguardar confirmação
    const receipt = await accountAPI.getUserOpReceipt(userOpHash);
    
    if (receipt) {
      console.log("✅ Todas as operações executadas com sucesso!");
      return { success: true, txHash: receipt };
    }

    throw new Error("Batch não confirmado");

  } catch (error) {
    console.error("❌ Erro no batch:", error);
    return { success: false, error };
  }
}

// Exemplo de uso
export async function exemploOperacoesBatch(accountAPI: any) {
  const operations = [
    {
      to: "0x742d35Cc6cd...",
      value: "0.01",
      description: "Enviar 0.01 ETH para Alice"
    },
    {
      to: "0x1f2f3f4f5f6f...",
      value: "0.02", 
      description: "Enviar 0.02 ETH para Bob"
    },
    {
      to: "0xA0Cf798816D4b9b5469F9AF8776c4B1b73E9E6B4", // USDC
      data: "0xa9059cbb...", // transfer() call data
      description: "Enviar 100 USDC para Charlie"
    }
  ];

  return await executeBatch(accountAPI, operations);
}
```

## 🤝 Recuperação Social

### Sistema de Guardiões

```typescript
// client/src/socialRecovery.ts

interface Guardian {
  email: string;
  publicKey: string;
  name: string;
}

interface RecoveryRequest {
  userEmail: string;
  newPublicKey: string;
  guardianApprovals: string[]; // Assinaturas dos guardiões
  expiresAt: number;
}

/**
 * Sistema de recuperação social
 */
export class SocialRecoveryManager {
  private guardians: Guardian[] = [];
  private recoveryThreshold = 2; // Mínimo de 2 guardiões

  /**
   * Adicionar guardiões de confiança
   */
  addGuardian(guardian: Guardian) {
    this.guardians.push(guardian);
    console.log(`🛡️ Guardião adicionado: ${guardian.name} (${guardian.email})`);
  }

  /**
   * Iniciar processo de recuperação
   */
  async initiateRecovery(
    userEmail: string,
    newPublicKey: string
  ): Promise<RecoveryRequest> {
    const request: RecoveryRequest = {
      userEmail,
      newPublicKey,
      guardianApprovals: [],
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 dias
    };

    // Notificar guardiões por email
    await this.notifyGuardians(request);

    console.log("🚨 Processo de recuperação iniciado");
    console.log(`📧 ${this.guardians.length} guardiões notificados`);
    
    return request;
  }

  /**
   * Guardião aprova recuperação
   */
  async approveRecovery(
    request: RecoveryRequest,
    guardianEmail: string,
    signature: string
  ): Promise<boolean> {
    // Verificar se é um guardião válido
    const guardian = this.guardians.find(g => g.email === guardianEmail);
    if (!guardian) {
      throw new Error("Guardião não autorizado");
    }

    // Verificar assinatura
    if (await this.verifyGuardianSignature(request, guardian, signature)) {
      request.guardianApprovals.push(signature);
      console.log(`✅ Aprovação recebida de ${guardian.name}`);
      
      // Verificar se atingiu o threshold
      if (request.guardianApprovals.length >= this.recoveryThreshold) {
        console.log("🎉 Threshold atingido! Recuperação aprovada!");
        await this.executeRecovery(request);
        return true;
      }
      
      return false;
    }

    throw new Error("Assinatura inválida");
  }

  private async notifyGuardians(request: RecoveryRequest) {
    // Enviar emails para os guardiões
    for (const guardian of this.guardians) {
      await this.sendRecoveryEmail(guardian, request);
    }
  }

  private async sendRecoveryEmail(guardian: Guardian, request: RecoveryRequest) {
    // Implementar envio de email real
    console.log(`📧 Email enviado para ${guardian.email}`);
    console.log(`🔗 Link de aprovação: /recovery/approve/${request.userEmail}`);
  }

  private async verifyGuardianSignature(
    request: RecoveryRequest,
    guardian: Guardian,
    signature: string
  ): Promise<boolean> {
    // Verificar se a assinatura é válida usando a chave pública do guardião
    // Implementação dependeria da biblioteca de criptografia escolhida
    return true; // Placeholder
  }

  private async executeRecovery(request: RecoveryRequest) {
    // Executar a recuperação na smart wallet
    console.log("🔄 Executando recuperação...");
    
    // Isso envolveria chamar uma função no smart contract
    // para atualizar a chave pública autorizada
  }
}
```

## 🔐 Múltiplos Provedores OAuth

### Suporte a Discord, Twitter, GitHub

```tsx
// client/src/MultiAuthComponent.tsx
import React, { useState } from 'react';

interface AuthProvider {
  name: string;
  icon: string;
  clientId: string;
  scope: string;
  authUrl: string;
}

const AUTH_PROVIDERS: AuthProvider[] = [
  {
    name: 'Google',
    icon: '🔍',
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID!,
    scope: 'email profile',
    authUrl: 'https://accounts.google.com/oauth/authorize'
  },
  {
    name: 'Discord',
    icon: '🎮',
    clientId: process.env.REACT_APP_DISCORD_CLIENT_ID!,
    scope: 'identify email',
    authUrl: 'https://discord.com/api/oauth2/authorize'
  },
  {
    name: 'GitHub',
    icon: '🐙',
    clientId: process.env.REACT_APP_GITHUB_CLIENT_ID!,
    scope: 'user:email',
    authUrl: 'https://github.com/login/oauth/authorize'
  },
  {
    name: 'Twitter',
    icon: '🐦',
    clientId: process.env.REACT_APP_TWITTER_CLIENT_ID!,
    scope: 'read:users',
    authUrl: 'https://twitter.com/i/oauth2/authorize'
  }
];

export function MultiAuthComponent() {
  const [selectedProvider, setSelectedProvider] = useState<AuthProvider | null>(null);

  const handleAuthClick = (provider: AuthProvider) => {
    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: `${window.location.origin}/auth/callback`,
      scope: provider.scope,
      response_type: 'code',
      state: provider.name.toLowerCase()
    });

    const authUrl = `${provider.authUrl}?${params.toString()}`;
    window.location.href = authUrl;
  };

  return (
    <div className="multi-auth">
      <h2>🔐 Escolha seu método de login</h2>
      
      <div className="auth-providers">
        {AUTH_PROVIDERS.map((provider) => (
          <button
            key={provider.name}
            className="auth-provider-btn"
            onClick={() => handleAuthClick(provider)}
          >
            <span className="icon">{provider.icon}</span>
            <span>Continuar com {provider.name}</span>
          </button>
        ))}
      </div>

      <div className="benefits">
        <h3>✨ Benefícios do Login Social + ERC-4337</h3>
        <ul>
          <li>🔒 Sem necessidade de gerenciar chaves privadas</li>
          <li>🎯 Carteira determinística baseada no seu login</li>
          <li>💳 Possibilidade de gas patrocinado</li>
          <li>🔄 Recuperação via seus provedores sociais</li>
          <li>⚡ Transações mais rápidas e baratas</li>
        </ul>
      </div>
    </div>
  );
}
```

## 🎨 Interface Melhorada

### Dashboard Completo

```tsx
// client/src/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { TransferComponent } from './TransferComponent';
import { SocialRecoveryManager } from './socialRecovery';

interface User {
  email: string;
  address: string;
  provider: string;
  balance?: string;
}

export function Dashboard({ user, privateKey, config }: {
  user: User;
  privateKey: string;
  config: any;
}) {
  const [balance, setBalance] = useState<string>('0');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadWalletData();
  }, [user.address]);

  const loadWalletData = async () => {
    // Carregar saldo
    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    const balance = await provider.getBalance(user.address);
    setBalance(ethers.utils.formatEther(balance));

    // Carregar histórico de transações (implementar via API)
    // setTransactions(await getTransactionHistory(user.address));
  };

  const tabs = [
    { id: 'overview', name: 'Visão Geral', icon: '📊' },
    { id: 'transfer', name: 'Transferir', icon: '💸' },
    { id: 'history', name: 'Histórico', icon: '📜' },
    { id: 'security', name: 'Segurança', icon: '🛡️' },
    { id: 'settings', name: 'Configurações', icon: '⚙️' }
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="user-info">
          <div className="avatar">
            {user.provider === 'google' && '🔍'}
            {user.provider === 'discord' && '🎮'}
            {user.provider === 'github' && '🐙'}
            {user.provider === 'twitter' && '🐦'}
          </div>
          <div>
            <h2>Olá! 👋</h2>
            <p>{user.email}</p>
          </div>
        </div>
        
        <div className="wallet-info">
          <div className="balance">
            <span className="label">Saldo:</span>
            <span className="value">{balance} ETH</span>
          </div>
          <div className="address">
            <span className="label">Carteira:</span>
            <span className="value">
              {user.address.substring(0, 6)}...{user.address.substring(-4)}
              <button onClick={() => navigator.clipboard.writeText(user.address)}>
                📋
              </button>
            </span>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="icon">{tab.icon}</span>
            <span className="label">{tab.name}</span>
          </button>
        ))}
      </nav>

      <main className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>💰 Saldo Total</h3>
                <p className="big-number">{balance} ETH</p>
                <span className="small-text">~$0 USD</span>
              </div>
              
              <div className="stat-card">
                <h3>📊 Transações</h3>
                <p className="big-number">{transactions.length}</p>
                <span className="small-text">Este mês</span>
              </div>
              
              <div className="stat-card">
                <h3>💎 Tipo da Carteira</h3>
                <p className="big-number">ERC-4337</p>
                <span className="small-text">Smart Contract</span>
              </div>
              
              <div className="stat-card">
                <h3>🌐 Rede</h3>
                <p className="big-number">Polygon</p>
                <span className="small-text">Mumbai Testnet</span>
              </div>
            </div>

            <div className="quick-actions">
              <h3>⚡ Ações Rápidas</h3>
              <div className="action-buttons">
                <button onClick={() => setActiveTab('transfer')}>
                  💸 Enviar
                </button>
                <button onClick={() => window.open(`https://mumbai.polygonscan.com/address/${user.address}`)}>
                  🔍 Ver no Explorer
                </button>
                <button onClick={() => setActiveTab('security')}>
                  🛡️ Configurar Segurança
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transfer' && (
          <TransferComponent 
            userPrivateKey={privateKey}
            config={config}
          />
        )}

        {activeTab === 'history' && (
          <div className="history">
            <h3>📜 Histórico de Transações</h3>
            {transactions.length === 0 ? (
              <p>Nenhuma transação encontrada.</p>
            ) : (
              <div className="transaction-list">
                {transactions.map((tx, i) => (
                  <div key={i} className="transaction-item">
                    <span className="direction">{tx.type}</span>
                    <span className="amount">{tx.amount} ETH</span>
                    <span className="date">{tx.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="security">
            <h3>🛡️ Configurações de Segurança</h3>
            
            <div className="security-section">
              <h4>👥 Recuperação Social</h4>
              <p>Configure guardiões para recuperar sua conta em caso de emergência.</p>
              <button>Configurar Guardiões</button>
            </div>

            <div className="security-section">
              <h4>💸 Limites de Gasto</h4>
              <p>Defina limites automáticos para transações.</p>
              <button>Configurar Limites</button>
            </div>

            <div className="security-section">
              <h4>🔄 Backup</h4>
              <p>Faça backup das suas configurações de segurança.</p>
              <button>Fazer Backup</button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings">
            <h3>⚙️ Configurações</h3>
            
            <div className="setting-group">
              <h4>🌐 Rede</h4>
              <select>
                <option value="mumbai">Polygon Mumbai (Testnet)</option>
                <option value="goerli">Ethereum Goerli (Testnet)</option>
                <option value="polygon">Polygon Mainnet</option>
              </select>
            </div>

            <div className="setting-group">
              <h4>💳 Paymaster</h4>
              <label>
                <input type="checkbox" />
                Usar patrocínio de gas quando disponível
              </label>
            </div>

            <div className="setting-group">
              <h4>🔔 Notificações</h4>
              <label>
                <input type="checkbox" />
                Notificar sobre transações recebidas
              </label>
              <label>
                <input type="checkbox" />
                Notificar sobre limites de gasto
              </label>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

## 🎯 CSS Moderno

```css
/* client/src/Dashboard.css */
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Inter', sans-serif;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
  border-radius: 16px;
  color: white;
  margin-bottom: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 48px;
  height: 48px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.wallet-info {
  text-align: right;
}

.balance, .address {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.label {
  font-size: 14px;
  opacity: 0.8;
}

.value {
  font-size: 16px;
  font-weight: 600;
}

.dashboard-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: white;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #f8f9fa;
}

.nav-item.active {
  background: #e3f2fd;
  color: #1976d2;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-card h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.big-number {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.small-text {
  font-size: 12px;
  color: #999;
}

.quick-actions {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-buttons button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #1976d2;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.action-buttons button:hover {
  background: #1565c0;
}
```

## 📦 Como Implementar

Para implementar essas extensões:

1. **Instale dependências adicionais:**
   ```bash
   npm install @types/node crypto-js
   ```

2. **Adicione variáveis de ambiente:**
   ```env
   REACT_APP_GOOGLE_CLIENT_ID=seu_google_client_id
   REACT_APP_DISCORD_CLIENT_ID=seu_discord_client_id
   REACT_APP_GITHUB_CLIENT_ID=seu_github_client_id
   REACT_APP_TWITTER_CLIENT_ID=seu_twitter_client_id
   REACT_APP_PAYMASTER_URL=sua_paymaster_url
   REACT_APP_PAYMASTER_API_KEY=sua_paymaster_key
   ```

3. **Crie os arquivos nos diretórios apropriados**

4. **Importe nos componentes principais**

5. **Configure os provedores OAuth adicionais**

6. **Teste as funcionalidades incrementalmente**

---

**🚀 Com essas extensões, sua aplicação ERC-4337 será muito mais robusta e próxima de um produto real!** 