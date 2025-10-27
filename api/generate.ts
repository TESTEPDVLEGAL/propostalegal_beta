import { GoogleGenAI } from "@google/genai";
import { QuoteData } from '../types';

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

    const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

    const prompt = `
      Gere uma proposta comercial formal e completa em formato de texto para o cliente:
      - Cliente: ${quoteData.clientInfo.name}
      - Cidade: ${quoteData.clientInfo.city}
      - Contato: ${quoteData.clientInfo.phone} / ${quoteData.clientInfo.email}
      A proposta é da empresa: ${quoteData.companyInfo.name}
      Detalhes do Orçamento:
      - Número: ${quoteData.quoteNumber}
      - Data: ${quoteData.date}
      - Validade: ${quoteData.validity}
      - Consultor de Vendas: ${quoteData.consultantName}
      
      ITENS DA MENSALIDADE (RECORRENTE):
      ${quoteData.monthlyItems.map(item => `- ${item.description}: ${formatCurrency(item.unitPrice)}`).join('\n')}
      Subtotal Mensal: ${formatCurrency(monthlySubtotal)}
      Desconto Aplicado: ${quoteData.discount}%
      **TOTAL MENSAL: ${formatCurrency(monthlyTotal)}**
      
      SERVIÇOS (PAGAMENTO ÚNICO):
      ${quoteData.oneTimeItems.length > 0 ? quoteData.oneTimeItems.map(item => `- ${item.description}: ${formatCurrency(item.unitPrice)}`).join('\n') : "Nenhum."}
      **TOTAL SERVIÇOS: ${formatCurrency(oneTimeTotal)}**
      
      Condições de Pagamento: ${quoteData.paymentTerms}
      
      ---
      INSTRUÇÕES PARA A IA:
      - Escreva um texto bem estruturado e profissional para esta proposta.
      - Comece com uma introdução e saudação personalizada ao cliente (${quoteData.clientInfo.name}).
      - Apresente claramente os produtos e serviços selecionados, explicando brevemente o valor que eles agregam.
      - Detalhe os valores de forma clara, como apresentado acima.
      - Finalize com os próximos passos, uma chamada para ação (ex: "para aprovar, responda a este e-mail") e coloque-se à disposição para dúvidas.
      - O tom deve ser profissional, consultivo e convincente.
    `;

    // 5. Chamar a API do Gemini
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    const text = response.text;

    // 6. Retornar a resposta com sucesso para o frontend
    return new Response(JSON.stringify({ quoteText: text }), {
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