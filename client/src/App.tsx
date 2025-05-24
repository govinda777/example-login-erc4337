/**
 * 🚀 COMPONENTE PRINCIPAL DA APLICAÇÃO
 * 
 * Este arquivo contém a lógica principal da aplicação que demonstra:
 * 1. Autenticação com Google OAuth
 * 2. Geração de carteiras ERC-4337 (Account Abstraction)
 * 3. Comunicação com o backend para persistir dados
 * 
 * FLUXO DA APLICAÇÃO:
 * Usuário faz login → Gera carteira ERC-4337 → Salva no backend → Exibe dados
 */

import React, { useEffect, useState } from "react";
import "./App.css";
import { ethers } from "ethers";
import jwt_decode from "jwt-decode";
import { getSimpleAccount } from "./getSimpleAccount";

// Importa as configurações da blockchain (URLs, contratos, etc.)
const config = require("./config.json");

/**
 * DECLARAÇÃO GLOBAL DO TIPO WINDOW
 * Necessário para adicionar a função handleCredentialResponse ao objeto window global
 * Isso permite que o Google Sign-In SDK chame nossa função após o login
 */
declare global {
  interface Window {
    handleCredentialResponse?: any;
  }
}

function App() {
  // 📊 DEFINIÇÃO DOS TIPOS E ESTADOS
  
  /**
   * Interface que define a estrutura dos dados do usuário
   * - email: Email obtido do Google OAuth
   * - address: Endereço da carteira ERC-4337 gerada
   */
  interface User {
    email: string;
    address: string;
  }
  
  // Estado vazio para quando não há usuário logado
  const emptyUser: User = { email: "", address: "" };
  
  // 🔄 ESTADOS DO REACT
  const [user, setUser] = useState({} as User);           // Dados do usuário logado (do Google)
  const [backendData, setBackendData] = useState({} as User); // Dados retornados pelo backend
  
  /**
   * 🔍 FUNÇÃO UTILITÁRIA: Verifica se o usuário está deslogado
   * 
   * @param user - Objeto do usuário para verificar
   * @returns true se o usuário está deslogado, false caso contrário
   */
  function isLoggedOut(user: User) {
    return (
      JSON.stringify(user) == JSON.stringify(emptyUser) ||
      Object.keys(user).length == 0
    );
  }

  // 🔐 AUTENTICAÇÃO COM GOOGLE
  
  /**
   * CALLBACK DO GOOGLE SIGN-IN
   * 
   * Esta função é chamada automaticamente pelo Google quando o usuário faz login.
   * O Google envia um JWT token que contém as informações do usuário.
   * 
   * PROCESSO:
   * 1. Recebe o token JWT do Google
   * 2. Decodifica o token para extrair as informações do usuário
   * 3. Atualiza o estado da aplicação com os dados do usuário
   * 4. Esconde o botão de login
   */
  window.handleCredentialResponse = (response: any) => {
    console.log("🔐 Usuário autenticado com Google!");
    
    // Decodifica o JWT token para extrair as informações do usuário
    var userObject = jwt_decode(response.credential as any);
    console.log("📧 Dados do usuário:", userObject);
    
    // Atualiza o estado com os dados do usuário
    setUser(userObject as any);
    
    // Esconde o botão de login do Google
    (document.getElementById("g_id_signin") as HTMLElement).hidden =
      isLoggedOut(user) ? true : false;
  };

  /**
   * 🚪 FUNÇÃO DE LOGOUT
   * 
   * Limpa todos os dados do usuário e mostra novamente o botão de login
   */
  function handleSignOut(event: any) {
    console.log("🚪 Usuário fazendo logout...");
    
    // Limpa os estados
    setUser(emptyUser);
    setBackendData(emptyUser);
    
    // Mostra novamente o botão de login do Google
    (document.getElementById("g_id_signin") as HTMLElement).hidden = false;
  }

  // 🌐 INTEGRAÇÃO COM BLOCKCHAIN (ERC-4337)
  
  /**
   * 🎯 GERAÇÃO DE ENDEREÇO ERC-4337
   * 
   * Esta função calcula o endereço da carteira inteligente (smart contract wallet)
   * usando o padrão ERC-4337 Account Abstraction.
   * 
   * COMO FUNCIONA:
   * 1. Usa a chave privada para criar uma instância da Account API
   * 2. Calcula o endereço "contrafactual" (endereço que o contrato terá quando for deployado)
   * 3. O endereço é determinístico baseado na chave privada e nos contratos factory
   * 
   * @param potentialWallet - Carteira Ethers.js com chave privada
   * @returns Endereço da carteira ERC-4337 (string)
   */
  async function getAddress(potentialWallet: ethers.Wallet) {
    console.log("🔄 Gerando endereço ERC-4337...");
    
    // Cria um provider para conectar com a blockchain (Polygon Mumbai)
    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    
    // Cria uma instância da Account API usando nossos contratos configurados
    const accountAPI = getSimpleAccount(
      provider,                        // Provider da blockchain
      potentialWallet.privateKey,      // Chave privada da carteira
      config.entryPoint,              // Endereço do contrato EntryPoint
      config.simpleAccountFactory     // Endereço do contrato SimpleAccountFactory
    );
    
    // Calcula o endereço que a carteira inteligente terá
    const address = await accountAPI.getCounterFactualAddress();
    console.log("✅ Endereço ERC-4337 gerado:", address);
    
    return address;
  }

  // 🔄 COMUNICAÇÃO COM BACKEND
  
  /**
   * 📡 ENVIAR DADOS PARA O SERVIDOR
   * 
   * Esta função é responsável por:
   * 1. Gerar uma nova carteira ERC-4337 se necessário
   * 2. Enviar os dados (email + endereço) para o backend
   * 3. Receber e exibir os dados persistidos
   * 
   * FLUXO:
   * 1. Verifica se o usuário está logado
   * 2. Gera uma carteira aleatória e calcula seu endereço ERC-4337
   * 3. Envia email + endereço para o backend via POST
   * 4. Backend verifica se já existe uma conta para o email
   * 5. Se não existe, cria nova; se existe, retorna a existente
   * 6. Atualiza a interface com os dados retornados
   */
  async function postAccount() {
    if (!isLoggedOut(user)) {
      console.log("📡 Enviando dados para o backend...");
      
      // ⚠️ IMPORTANTE: Em um ambiente de produção, a chave privada deveria ser
      // armazenada de forma segura (criptografada) ou derivada de forma determinística
      // TODO: Implementar armazenamento seguro da chave privada!
      const potentialWallet = ethers.Wallet.createRandom();
      console.log("🔑 Carteira gerada (ATENÇÃO: chave não está sendo persistida!)");
      
      // Calcula o endereço ERC-4337 correspondente à chave privada
      const potentialAddress = await getAddress(potentialWallet);

      // Prepara os dados para enviar ao backend
      const postData = {
        email: user.email,           // Email do Google OAuth
        address: potentialAddress,   // Endereço ERC-4337 gerado
      };
      
      // Envia requisição POST para o backend
      fetch("http://localhost:5000/return-account", {
        method: "POST",
        body: JSON.stringify(postData),
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("✅ Dados recebidos do backend:", data);
          setBackendData(data);
        })
        .catch((error) => {
          console.error("❌ Erro ao comunicar com backend:", error);
        });
    }
  }

  // ⚡ EFEITO REATIVO
  
  /**
   * 🔄 HOOK useEffect
   * 
   * Executa automaticamente quando o estado 'user' muda.
   * Isso significa que sempre que um usuário faz login ou logout,
   * a função postAccount() é chamada para sincronizar com o backend.
   */
  useEffect(() => {
    postAccount();
  }, [user]); // Dependência: executa quando 'user' muda

  // 🎨 RENDERIZAÇÃO DA INTERFACE
  
  return (
    <div className="App">
      <header className="App-header">
        {/* 
          🔐 GOOGLE SIGN-IN SETUP
          
          Este div configura o comportamento do Google Sign-In:
          - data-client_id: ID do seu app no Google Console
          - data-callback: Nome da função que será chamada após login
          - data-auto_prompt: Não mostrar popup automaticamente
        */}
        <div
          id="g_id_onload"
          data-client_id="247332257621-9rev3pq5eef71olb55jvu8b2gkbd5c1h.apps.googleusercontent.com"
          data-context="signin"
          data-ux_mode="popup"
          data-callback="handleCredentialResponse"
          data-auto_prompt="false"
        ></div>

        {/* 
          🎯 BOTÃO DE LOGIN DO GOOGLE
          
          Este div será transformado pelo Google Sign-In SDK em um botão de login.
          As configurações controlam a aparência do botão.
        */}
        <div
          id="g_id_signin"
          className="g_id_signin"
          data-type="standard"
          data-shape="rectangular"
          data-theme="outline"
          data-text="continue_with"
          data-size="large"
          data-logo_alignment="left"
        ></div>

        {/* 
          👤 INTERFACE DO USUÁRIO LOGADO
          
          Esta seção só aparece quando o usuário está logado.
          Mostra:
          - Botão de logout
          - Email do usuário
          - Endereço da carteira ERC-4337
        */}
        {!isLoggedOut(user) && (
          <>
            <button onClick={(e) => handleSignOut(e)}>Sign out</button>
            <p>Email: {backendData.email}</p>
            <p>Account Owner: {backendData.address}</p>
            
            {/* 
              💡 INFORMAÇÕES EDUCATIVAS
              Adicione estas informações para tornar mais didático
            */}
            <div style={{ marginTop: '20px', fontSize: '14px', color: '#888' }}>
              <p>🔐 Você está logado com uma carteira ERC-4337!</p>
              <p>📧 Seu email está associado ao endereço da carteira acima</p>
              <p>🌐 Esta carteira funciona na rede Polygon Mumbai (testnet)</p>
            </div>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
