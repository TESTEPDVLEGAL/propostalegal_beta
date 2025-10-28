import { GoogleGenAI } from "@google/genai";
import { QuoteData } from '../types.js';

/**
 * Vercel Serverless Function
 * Este arquivo na pasta `/api` se torna um endpoint de API automaticamente.
 * A requisição do frontend para `/api/generate` será direcionada para esta função.
 */
export default async function handler(req: Request) {
  // 1. Validar o método da requisição
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), { 
        status: 405, 
        headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    // 2. Extrair e validar os dados do corpo da requisição
    const quoteData = await req.json() as QuoteData;
    if (!quoteData || !quoteData.clientInfo || !quoteData.monthlyItems) {
        return new Response(JSON.stringify({ error: 'Dados da proposta inválidos ou ausentes.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 3. Obter a API Key de forma segura do ambiente do servidor
    if (!process.env.API_KEY) {
        console.error("A variável de ambiente API_KEY não foi definida no servidor.");
        return new Response(JSON.stringify({ error: 'A configuração do servidor está incompleta.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 4. Construir o prompt para a IA
    const monthlySubtotal = quoteData.monthlyItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const monthlyTotal = monthlySubtotal * (1 - (quoteData.discount / 100));
    const oneTimeTotal = quoteData.oneTimeItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const totalAtivacao = monthlyTotal + oneTimeTotal;

    const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

    // Seções dinâmicas
    const selectedMonthlyItemsList = quoteData.monthlyItems
        .map(item => `- ☑ ${item.description}`)
        .join('\n');

    const oneTimeServicesDescription = quoteData.oneTimeItems.length > 0
        ? quoteData.oneTimeItems.map(item => item.description).join(' e ')
        : 'Implantação, Configuração e Treinamento'; // Texto padrão

    // Seção condicional para "Servidor Virtualizado"
    const cloudItem = quoteData.monthlyItems.find(item => item.id === 'cloud');
    const opcoesImplantacaoText = cloudItem ? `
### Servidor Virtualizado
- Centraliza as informações em nuvem, permitindo integração entre os PDVs mesmo que estejam em redes diferentes (ex: filiais distintas).
- Em caso de instabilidade da internet, o sistema mantém a comunicação via rede 4G, garantindo continuidade da operação.
- Observação: quando operando em 4G, a comunicação com impressoras de rede é interrompida temporariamente.
**Valor:**
- ${formatCurrency(cloudItem.unitPrice)} mensais
` : '';

    const prompt = `
INSTRUÇÕES PARA A IA:
- Você é um assistente que formata propostas comerciais em Markdown.
- Sua tarefa é gerar uma proposta seguindo ESTRITAMENTE a estrutura e o texto do modelo abaixo.
- A única parte que você deve escrever de forma criativa é uma breve saudação e um parágrafo de introdução (no máximo 2 parágrafos curtos) no local indicado por "<SAUDAÇÃO E INTRODUÇÃO AQUI>".
- Para todo o resto do documento, use o texto e a formatação EXATAMENTE como fornecido no modelo, apenas preenchendo as informações dinâmicas (nome do cliente, itens, valores, etc.).
- NÃO adicione nenhuma seção, texto, explicação ou formatação que não esteja explicitamente no modelo.

--- INÍCIO DO MODELO DE PROPOSTA ---

# Proposta Comercial – PDV Legal
**Cliente:** ${quoteData.clientInfo.name}
**Data:** ${quoteData.date}
**Consultor:** ${quoteData.consultantName} – Executivo de Vendas
***
<SAUDAÇÃO E INTRODUÇÃO AQUI>

Abaixo, detalhamos a solução proposta para o **${quoteData.clientInfo.name}**:

${selectedMonthlyItemsList}

**Mensalidade:** ${formatCurrency(monthlyTotal)} (Recorrente)

- **Serviço:** ${oneTimeServicesDescription}.
  **Valor:** ${formatCurrency(oneTimeTotal)} (Único)

**Total para ativação:** ${formatCurrency(monthlyTotal)} + ${formatCurrency(oneTimeTotal)} = **${formatCurrency(totalAtivacao)}**
***
## Equipamentos

### PDV 100% Android
Maquinas Smart POS ou qualquer equipamento Android compatível.
Adquirentes homologadas: Stone, Getnet, Bin, Cielo, Caixa, Sicredi e Banrisul.

### Raspberry Pi - Compartilhamento de Mesas/Comandas
O Raspberry Pi é o equipamento responsável por atuar como servidor local, permitindo o compartilhamento de mesas e comandas entre todos os PDVs conectados à mesma rede. Sem esse recurso, as mesas ficam armazenadas apenas na memória interna do terminal onde foram abertas, impedindo que outros equipamentos visualizem ou movimentem essas informações — o que pode causar falhas no atendimento e perda de controle sobre as vendas em andamento.

## Opções de Implantação
${opcoesImplantacaoText}
*Caso necessite de uma estrutura com servidor físico (Raspberry Local), consulte-nos para uma cotação personalizada.*

## Condições Comerciais
- Sem fidelidade contratual.
- Ativação mediante confirmação de pagamento da implantação.
- Pagamento via boleto bancário ou cartão de crédito recorrente.

## Resumo da Implantação
- Importação de cardápio via planilha.
- Treinamento remoto via Teams (necessário notebook/computador conectado).
- Suporte e acompanhamento contínuo pós-implantação.

## Suporte Técnico
- Segunda a sexta: 8h às 22h
- Sábado: 10h às 22h
- Domingo: 11h às 18h
- **Telefone/WhatsApp:** (11) 4063-6771
- **E-mail:** ${quoteData.companyInfo.email}
***
Agradecemos a confiança e desejamos que este seja o início de uma parceria de sucesso! 💙

**${quoteData.consultantName}**
*Executivo de Novas Contas*
${quoteData.companyInfo.name}
${quoteData.companyInfo.phone} | ${quoteData.companyInfo.email}

--- FIM DO MODELO DE PROPOSTA ---
    `;

    // 5. Chamar a API do Gemini
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
    });

    const text = response.text;
    
    // Adiciona uma verificação robusta para respostas vazias ou bloqueadas
    if (!text) {
        const blockReason = response.promptFeedback?.blockReason;
        const safetyRatings = response.promptFeedback?.safetyRatings;
        console.error(
            "A resposta da IA veio vazia. Pode ter sido bloqueada.",
            { blockReason, safetyRatings }
        );
        throw new Error(`A IA não retornou um texto. A requisição pode ter sido bloqueada por segurança. Motivo: ${blockReason || 'desconhecido'}`);
    }

    // 6. Retornar a resposta com sucesso para o frontend
    return new Response(JSON.stringify({ quoteText: text.replace('--- INÍCIO DO MODELO DE PROPOSTA ---\n', '').replace('\n--- FIM DO MODELO DE PROPOSTA ---', '') }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Erro na função da API (/api/generate):", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido no servidor.";
    return new Response(JSON.stringify({ error: `Falha ao gerar proposta no servidor: ${errorMessage}` }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}