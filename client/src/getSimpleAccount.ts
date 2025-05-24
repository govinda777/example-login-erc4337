/**
 * 🔧 MÓDULO DE ACCOUNT ABSTRACTION ERC-4337
 * 
 * Este arquivo contém a lógica para criar e configurar uma Smart Wallet
 * usando o padrão ERC-4337 (Account Abstraction).
 * 
 * PRINCIPAIS FUNCIONES:
 * 1. Criar uma instância de SimpleAccountAPI
 * 2. Configurar os contratos necessários (EntryPoint, Factory)
 * 3. Calcular endereços de carteiras determinísticos
 * 4. Corrigir bugs do SDK original (getUserOpReceipt)
 * 
 * DEPENDÊNCIAS:
 * - @account-abstraction/sdk: SDK oficial para ERC-4337
 * - ethers: Biblioteca para interagir com Ethereum
 */

import { SimpleAccountAPI } from "@account-abstraction/sdk";
import { ethers } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";

/**
 * 🏭 FUNÇÃO PRINCIPAL: getSimpleAccount
 * 
 * Esta função é o ponto de entrada para criar uma Smart Wallet ERC-4337.
 * Ela configura todos os componentes necessários e retorna uma instância
 * pronta para calcular endereços e enviar transações.
 * 
 * PARÂMETROS:
 * @param provider - Conexão com a blockchain (Polygon Mumbai)
 * @param signingKey - Chave privada que controla a smart wallet
 * @param entryPointAddress - Endereço do contrato EntryPoint na rede
 * @param factoryAddress - Endereço do contrato SimpleAccountFactory
 * 
 * RETORNO:
 * @returns SimpleAccountAPI configurada e pronta para uso
 * 
 * PROCESSO:
 * 1. Cria uma carteira Ethers.js com a chave privada
 * 2. Inicializa a SimpleAccountAPI com os contratos
 * 3. Aplica correção para bug do getUserOpReceipt
 * 4. Retorna a instância configurada
 */
export function getSimpleAccount(
  provider: JsonRpcProvider,
  signingKey: string,
  entryPointAddress: string,
  factoryAddress: string
) {
  console.log("🏭 Inicializando SimpleAccount com parâmetros:");
  console.log(`🔑 Chave de assinatura: ${signingKey.substring(0, 10)}...`);
  console.log(`🚪 EntryPoint: ${entryPointAddress}`);
  console.log(`🏗️ Factory: ${factoryAddress}`);

  // 👤 CRIAR OWNER (DONO DA CARTEIRA)
  
  /**
   * Cria uma instância de carteira Ethers.js que será o "owner" da smart wallet.
   * Esta carteira é quem assina as UserOperations, mas NÃO é a carteira que
   * os usuários veem (isso é a smart wallet).
   * 
   * IMPORTANTE: Esta chave privada controla a smart wallet!
   */
  const owner = new ethers.Wallet(signingKey, provider);
  console.log(`👤 Owner criado: ${owner.address}`);

  // 🚀 CRIAR SMART WALLET API
  
  /**
   * Inicializa a SimpleAccountAPI com todos os componentes necessários.
   * Esta API permite:
   * - Calcular o endereço da smart wallet (getCounterFactualAddress)
   * - Criar UserOperations para transações
   * - Enviar transações via bundler
   * - Verificar status de transações
   */
  const sw = new SimpleAccountAPI({
    provider,                // Conexão com blockchain
    entryPointAddress,       // Contrato que processa UserOperations
    owner,                   // Carteira que assina as operações
    factoryAddress,          // Contrato que cria novas smart wallets
  });

  console.log("✅ SimpleAccountAPI inicializada com sucesso!");

  // 🔧 CORREÇÃO DE BUG (HACK NECESSÁRIO)
  
  /**
   * PROBLEMA IDENTIFICADO:
   * A implementação padrão do getUserOpReceipt no SDK oficial tem um bug
   * onde não especifica o parâmetro fromBlock nas queries de eventos.
   * Isso causa erros em alguns provedores RPC que requerem este parâmetro.
   * 
   * SOLUÇÃO:
   * Sobrescrevemos a função para incluir fromBlock nas queries de eventos.
   * Isso garante compatibilidade com mais provedores RPC.
   */
  sw.getUserOpReceipt = async (
    userOpHash: string,
    timeout = 30000,    // 30 segundos de timeout
    interval = 5000     // Verificar a cada 5 segundos
  ): Promise<string | null> => {
    console.log(`🔍 Buscando recibo para UserOp: ${userOpHash}`);

    // 📜 ABI DO EVENTO UserOperationEvent
    
    /**
     * Definimos o ABI apenas para o evento que precisamos escutar.
     * O UserOperationEvent é emitido quando uma UserOperation é processada.
     */
    const abi = [
      "event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)",
    ];

    // Cria uma instância do contrato EntryPoint para escutar eventos
    const ep = new ethers.Contract(sw.entryPointAddress, abi, sw.provider);

    // 🔍 BUSCA COM TIMEOUT E RETRY
    
    /**
     * Obtemos o bloco mais recente para definir uma janela de busca.
     * Vamos procurar eventos nos últimos 100 blocos ou desde o bloco 100,
     * o que for maior.
     */
    const block = await sw.provider.getBlock("latest");
    const endtime = Date.now() + timeout;
    
    console.log(`⏰ Buscando eventos até: ${new Date(endtime).toISOString()}`);
    console.log(`📦 Bloco atual: ${block.number}`);

    // Loop de retry até encontrar o evento ou timeout
    while (Date.now() < endtime) {
      try {
        /**
         * CORREÇÃO DO BUG:
         * Especificamos fromBlock explicitamente para evitar erro RPC.
         * Buscamos nos últimos 100 blocos ou desde o bloco 100.
         */
        const fromBlock = Math.max(100, block.number - 100);
        
        console.log(`🔎 Buscando eventos de ${fromBlock} até ${block.number}`);
        
        const events = await ep.queryFilter(
          ep.filters.UserOperationEvent(userOpHash), // Filtro por hash específico
          fromBlock                                   // CORREÇÃO: incluir fromBlock
        );

        if (events.length > 0) {
          const event = events[0];
          console.log(`✅ Evento encontrado! TxHash: ${event.transactionHash}`);
          console.log(`📊 Detalhes do evento:`, {
            sender: event.args?.sender,
            success: event.args?.success,
            actualGasCost: event.args?.actualGasCost?.toString(),
            actualGasUsed: event.args?.actualGasUsed?.toString()
          });
          
          return event.transactionHash;
        }

        console.log(`⏳ Nenhum evento encontrado, tentando novamente em ${interval/1000}s...`);
        
        // Aguarda o intervalo antes da próxima tentativa
        await new Promise((resolve) => setTimeout(resolve, interval));
        
      } catch (error) {
        console.error("❌ Erro ao buscar eventos:", error);
        // Continua tentando mesmo com erro
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    console.log("⌛ Timeout: UserOperation não foi processada no tempo esperado");
    return null;
  };

  console.log("🔧 Função getUserOpReceipt corrigida aplicada");

  // 📤 RETORNA API CONFIGURADA
  
  /**
   * Retorna a instância de SimpleAccountAPI totalmente configurada e pronta para:
   * 
   * PRINCIPAIS MÉTODOS DISPONÍVEIS:
   * - getCounterFactualAddress(): Calcula endereço da smart wallet
   * - createSignedUserOp(): Cria UserOperation assinada
   * - getUserOpReceipt(): Busca recibo de UserOperation (versão corrigida)
   * - getAccountAddress(): Endereço da smart wallet (após deploy)
   * 
   * EXEMPLO DE USO:
   * ```typescript
   * const accountAPI = getSimpleAccount(...);
   * const address = await accountAPI.getCounterFactualAddress();
   * console.log("Endereço da smart wallet:", address);
   * ```
   */
  return sw;
}

export default getSimpleAccount;

/**
 * 💡 NOTAS TÉCNICAS IMPORTANTES
 * 
 * 1. **Endereço Determinístico**:
 *    O endereço da smart wallet é calculado de forma determinística
 *    baseado na chave privada do owner e no contrato factory.
 *    Isso significa que a mesma chave sempre gera o mesmo endereço.
 * 
 * 2. **Deploy Sob Demanda**:
 *    A smart wallet só é realmente deployada na blockchain quando
 *    a primeira transação é enviada. Antes disso, é apenas um endereço calculado.
 * 
 * 3. **Gas Abstraction**:
 *    Com ERC-4337, é possível que outra entidade (Paymaster) pague
 *    o gas em nome do usuário, usando tokens ERC-20 ou até mesmo
 *    de forma gratuita.
 * 
 * 4. **Batch Transactions**:
 *    Uma UserOperation pode conter múltiplas chamadas de função,
 *    permitindo operações complexas em uma única transação.
 * 
 * 5. **Upgradabilidade**:
 *    Smart wallets podem ser projetadas para serem upgradáveis,
 *    permitindo adicionar funcionalidades no futuro.
 * 
 * 📚 RECURSOS PARA APRENDER MAIS:
 * - EIP-4337: https://eips.ethereum.org/EIPS/eip-4337
 * - Account Abstraction SDK: https://github.com/eth-infinitism/account-abstraction
 * - Stackup Docs: https://docs.stackup.sh/
 */