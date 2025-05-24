/**
 * 🚀 SERVIDOR BACKEND - API REST
 * 
 * Este arquivo implementa um servidor Express simples que:
 * 1. Gerencia a associação entre emails e endereços de carteira ERC-4337
 * 2. Usa um banco de dados NeDB (file-based) para persistência
 * 3. Fornece API REST para o frontend React
 * 
 * ENDPOINTS:
 * POST /return-account - Cria ou retorna uma conta baseada no email
 * 
 * TECNOLOGIAS:
 * - Express.js: Framework web para Node.js
 * - NeDB: Banco de dados embarcado (similar ao MongoDB)
 * - CORS: Permite requisições cross-origin do frontend
 * - TypeScript: Tipagem estática para JavaScript
 */

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import Datastore from "nedb";

// 🔧 CONFIGURAÇÃO DO SERVIDOR EXPRESS
const app = express();

// Middleware para parsear JSON nas requisições
app.use(bodyParser.json());

// Middleware para permitir requisições cross-origin (frontend em porta diferente)
app.use(cors());

// 💾 CONFIGURAÇÃO DO BANCO DE DADOS

/**
 * Inicialização do banco NeDB
 * 
 * NeDB é um banco de dados embarcado que:
 * - Funciona como MongoDB mas sem servidor separado
 * - Armazena dados em um arquivo local (accounts.db)
 * - É adequado para desenvolvimento e pequenos projetos
 * 
 * ⚠️ PRODUÇÃO: Substitua por PostgreSQL, MongoDB ou similar
 */
const accountsDB = new Datastore({ 
  filename: "./accounts.db",  // Arquivo onde os dados são salvos
  autoload: true              // Carrega automaticamente na inicialização
});

console.log("💾 Banco de dados NeDB inicializado (arquivo: accounts.db)");

// 🛠️ API ENDPOINTS

/**
 * 📡 ENDPOINT PRINCIPAL: POST /return-account
 * 
 * Este endpoint é responsável por:
 * 1. Receber email + endereço de carteira do frontend
 * 2. Verificar se já existe uma conta para o email
 * 3. Se não existe, criar nova conta no banco
 * 4. Retornar os dados da conta (nova ou existente)
 * 
 * BODY DA REQUISIÇÃO:
 * {
 *   "email": "usuario@gmail.com",
 *   "address": "0x742d35Cc6cd..."
 * }
 * 
 * RESPOSTA:
 * {
 *   "_id": "abc123",
 *   "email": "usuario@gmail.com", 
 *   "address": "0x742d35Cc6cd..."
 * }
 */
app.post("/return-account", async (req, res) => {
  console.log("\n📡 Nova requisição recebida em /return-account");
  
  // Extrai email e endereço do corpo da requisição
  const { email, address } = req.body;
  console.log(`📧 Email: ${email}`);
  console.log(`🏠 Endereço: ${address}`);
  
  // Verifica se o email já existe no banco de dados
  if (!(await emailExists(email))) {
    console.log(`✨ ${email} não existe no banco. Criando nova conta...`);
    await createAccount(email, address);
  } else {
    console.log(`✅ ${email} já existe no banco. Retornando conta existente...`);
  }

  // Busca e retorna os dados da conta (nova ou existente)
  try {
    let account = await getAccountByEmail(email);
    console.log("📤 Enviando dados da conta:", account);
    res.send(account);
  } catch (error) {
    console.error("❌ Erro ao buscar conta:", error);
    res.status(500).send(error);
  }
});

// 🚀 INICIALIZAÇÃO DO SERVIDOR

/**
 * Configuração da porta do servidor
 * - Usa variável de ambiente PORT se disponível
 * - Caso contrário, usa porta 3001 como padrão
 */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Frontend deve fazer requisições para: http://localhost:${PORT}`);
  console.log(`📊 Banco de dados: ./accounts.db`);
  console.log("✅ Servidor pronto para receber requisições!\n");
});

// 🔧 FUNÇÕES UTILITÁRIAS DO BANCO DE DADOS

/**
 * 🔍 VERIFICA SE EMAIL EXISTE
 * 
 * Função assíncrona que verifica se um email já está cadastrado no banco.
 * 
 * @param email - Email a ser verificado
 * @returns Promise<boolean> - true se existe, false se não existe
 * 
 * FUNCIONAMENTO:
 * 1. Executa uma query findOne no banco NeDB
 * 2. Se encontrar um documento, retorna true
 * 3. Se não encontrar (null), retorna false
 */
async function emailExists(email: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Verificando se ${email} existe no banco...`);
    
    accountsDB.findOne({ email }, (err: any, account: any) => {
      if (err) {
        console.error("❌ Erro ao verificar email:", err);
        reject(err);
        return;
      }
      
      const exists = account !== null;
      console.log(`${exists ? '✅' : '❌'} Email ${email} ${exists ? 'encontrado' : 'não encontrado'}`);
      resolve(exists);
    });
  });
}

/**
 * ✨ CRIAR NOVA CONTA
 * 
 * Função assíncrona que cria uma nova conta no banco de dados.
 * 
 * @param email - Email do usuário
 * @param address - Endereço da carteira ERC-4337
 * @returns Promise<any> - Dados da conta criada
 * 
 * FUNCIONAMENTO:
 * 1. Insere um novo documento no banco NeDB
 * 2. NeDB automaticamente adiciona um _id único
 * 3. Retorna os dados da conta criada
 */
async function createAccount(email: string, address: string): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log(`✨ Criando nova conta para ${email}...`);
    
    // Dados da nova conta
    const newAccountData = { 
      email: email, 
      address: address,
      createdAt: new Date().toISOString() // Adiciona timestamp para referência
    };
    
    accountsDB.insert(newAccountData, (err, newAccount) => {
      if (err) {
        console.error("❌ Erro ao criar conta:", err);
        reject(err);
        return;
      }
      
      console.log("✅ Conta criada com sucesso:", newAccount);
      resolve(newAccount);
    });
  });
}

/**
 * 🔎 BUSCAR CONTA POR EMAIL
 * 
 * Função assíncrona que busca uma conta específica pelo email.
 * 
 * @param email - Email da conta a ser buscada
 * @returns Promise<any> - Dados da conta encontrada
 * 
 * FUNCIONAMENTO:
 * 1. Executa uma query findOne no banco NeDB
 * 2. Retorna os dados completos da conta (incluindo _id)
 * 3. Em caso de erro, rejeita a Promise
 */
async function getAccountByEmail(email: string): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log(`🔎 Buscando conta para ${email}...`);
    
    accountsDB.findOne({ email }, (err, account) => {
      if (err) {
        console.error("❌ Erro ao buscar conta:", err);
        reject(err);
        return;
      }
      
      if (account) {
        console.log("✅ Conta encontrada:", account);
      } else {
        console.log("❌ Nenhuma conta encontrada para este email");
      }
      
      resolve(account);
    });
  });
}

// 💡 INFORMAÇÕES ADICIONAIS PARA DESENVOLVIMENTO

/**
 * 📊 ESTRUTURA DO BANCO DE DADOS
 * 
 * Cada documento no banco tem a seguinte estrutura:
 * {
 *   "_id": "string-gerada-automaticamente",
 *   "email": "usuario@gmail.com",
 *   "address": "0x742d35Cc6cd...",
 *   "createdAt": "2024-01-01T12:00:00.000Z"
 * }
 * 
 * 🔧 MELHORIAS PARA PRODUÇÃO:
 * 
 * 1. Validação de dados:
 *    - Validar formato do email
 *    - Validar formato do endereço Ethereum
 *    - Sanitizar inputs
 * 
 * 2. Segurança:
 *    - Autenticação JWT
 *    - Rate limiting
 *    - HTTPS obrigatório
 *    - Validação de origem das requisições
 * 
 * 3. Banco de dados robusto:
 *    - PostgreSQL ou MongoDB
 *    - Índices para performance
 *    - Backup automático
 *    - Pool de conexões
 * 
 * 4. Logging e monitoramento:
 *    - Winston para logs estruturados
 *    - Métricas de performance
 *    - Alertas de erro
 * 
 * 5. Tratamento de erros:
 *    - Middleware de erro global
 *    - Códigos de status HTTP apropriados
 *    - Mensagens de erro padronizadas
 */
