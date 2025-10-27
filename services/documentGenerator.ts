// FIX: Implemented the document generator service using Gemini API to resolve 'Cannot find name' errors.
import { QuoteData } from '../types.js';

/**
 * Envia os dados do orçamento para um endpoint de backend seguro, que por sua vez chama a API da Gemini.
 * Isso protege a chave da API, que nunca é exposta no lado do cliente.
 * @param quoteData Os dados do orçamento a serem enviados.
 * @returns O texto da proposta gerado pela IA.
 */
export const generateQuoteWithAI = async (quoteData: QuoteData): Promise<string> => {
  try {
    // A chamada agora é para o nosso próprio backend proxy, não diretamente para o Google.
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quoteData),
    });

    if (!response.ok) {
        // Tenta ler uma mensagem de erro do corpo da resposta do backend.
        const errorData = await response.json().catch(() => ({ error: 'O servidor retornou um erro inesperado.' }));
        throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
    }

    const data = await response.json();
    if (!data.quoteText) {
        throw new Error("A resposta da API não continha o texto da proposta.");
    }

    return data.quoteText;

  } catch (error) {
    console.error("Erro ao chamar o backend para gerar a proposta:", error);
    if (error instanceof Error) {
        throw new Error(`Falha ao comunicar com o servidor para gerar o orçamento. Detalhes: ${error.message}`);
    }
    throw new Error("Falha ao comunicar com o servidor para gerar o orçamento. Por favor, tente novamente.");
  }
};