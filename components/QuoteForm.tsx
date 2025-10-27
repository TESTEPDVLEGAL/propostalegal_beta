// FIX: Implemented the QuoteForm component to resolve 'Cannot find name' errors.
import React, { useState, useMemo, useEffect } from 'react';
import { QuoteData, ClientInfo } from '../types';
import { 
    INITIAL_CLIENT_INFO, 
    DEFAULT_COMPANY_INFO, 
    MONTHLY_MODULES,
    PDV_OPTIONS,
    DELIVERY_PLANS,
    ONE_TIME_SERVICES,
    ALL_MONTHLY_ITEMS,
    ADDITIONAL_SERVICES
} from '../constants';
import { generateQuoteWithAI } from '../services/documentGenerator';
import { exportToPdf, exportToWord } from '../services/fileExporter';

export const QuoteForm: React.FC = () => {
  const [clientInfo, setClientInfo] = useState<ClientInfo>(INITIAL_CLIENT_INFO);
  const [consultantName, setConsultantName] = useState('');
  
  // State for selections
  const [selections, setSelections] = useState<Record<string, boolean>>({});
  const [selectedPdv, setSelectedPdv] = useState<string>('0');
  const [selectedDelivery, setSelectedDelivery] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [serviceBudget, setServiceBudget] = useState<number>(0);
  const [serviceDiscount, setServiceDiscount] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [isFeeSuggested, setIsFeeSuggested] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuote, setGeneratedQuote] = useState('');
  const [lastQuoteData, setLastQuoteData] = useState<QuoteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cloudSelected = selections['cloud'];
    const estoqueSelected = selections['estoque'];
    const pdvCount = parseInt(selectedPdv, 10);
    const pdvIsThreeOrLess = pdvCount >= 0 && pdvCount <= 3;

    // FIX: Check against ALL_MONTHLY_ITEMS to correctly trigger the R$699 rule
    // for any module, including delivery plans and additional services.
    const otherModulesSelectedCount = Object.keys(selections).filter(id => 
        selections[id] &&
        id !== 'cloud' &&
        ALL_MONTHLY_ITEMS.some(module => module.id === id)
    ).length;

    let suggestedServiceFee = 0;
    let suggestionApplied = false;

    // Rule 3 (Most specific): Cloud + Estoque + <= 3 PDVs
    if (cloudSelected && estoqueSelected && pdvIsThreeOrLess) {
        suggestedServiceFee = 499.00;
        suggestionApplied = true;
    } 
    // Rule 2: Cloud + at least one other module
    else if (cloudSelected && otherModulesSelectedCount > 0) {
        suggestedServiceFee = 699.00;
        suggestionApplied = true;
    } 
    // Rule 1: Cloud + <= 3 PDVs (and no other modules)
    else if (cloudSelected && pdvIsThreeOrLess) {
        suggestedServiceFee = 299.00;
        suggestionApplied = true;
    }

    setServiceBudget(suggestedServiceFee);
    setIsFeeSuggested(suggestionApplied);

  }, [selections, selectedPdv]);

  const getQuoteMetadata = () => {
    const now = new Date();
    return {
      quoteNumber: `ORC-${now.getFullYear()}-${String(now.getTime()).slice(-5)}`,
      date: now.toLocaleDateString('pt-BR'),
      validity: '15 dias',
      paymentTerms: 'Consulte as condições comerciais na proposta.',
    }
  }

  const handleSelectionChange = (id: string) => {
    setSelections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const { monthlyTotal, oneTimeTotal, totalWithDiscount, dailyTotal, multipliedTotal } = useMemo(() => {
    const monthly = Object.keys(selections)
        .filter(key => selections[key])
        .reduce((acc, key) => {
            const item = ALL_MONTHLY_ITEMS.find(m => m.id === key);
            return acc + (item?.price || 0);
        }, 0);

    const pdvPrice = PDV_OPTIONS[selectedPdv]?.price || 0;
    const monthlyTotal = monthly + pdvPrice;

    const oneTime = Object.keys(selections)
        .filter(key => selections[key])
        .reduce((acc, key) => {
            const item = ONE_TIME_SERVICES.find(s => s.id === key);
            return acc + (item?.price || 0);
        }, 0);
        
    const serviceTotal = serviceBudget > 0 ? serviceBudget * (1 - (serviceDiscount / 100)) : 0;
    const oneTimeTotal = oneTime + serviceTotal;
    
    const totalWithDiscount = monthlyTotal * (1 - (discount / 100));
    const dailyTotal = totalWithDiscount / 30;
    const multipliedTotal = totalWithDiscount * (multiplier > 0 ? multiplier : 1);

    return { monthlyTotal, oneTimeTotal, totalWithDiscount, dailyTotal, multipliedTotal };
  }, [selections, selectedPdv, discount, serviceBudget, serviceDiscount, multiplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedQuote('');
    setError(null);
    setLastQuoteData(null);

    const monthlyItems = Object.keys(selections)
        .filter(key => selections[key] && ALL_MONTHLY_ITEMS.some(item => item.id === key))
        .map(key => {
            const item = ALL_MONTHLY_ITEMS.find(m => m.id === key)!;
            return { id: item.id, description: item.name, quantity: 1, unitPrice: item.price };
        });
    
    if (selectedPdv !== '0' && PDV_OPTIONS[selectedPdv]) {
        const pdv = PDV_OPTIONS[selectedPdv];
        monthlyItems.push({ id: `pdv_${selectedPdv}`, description: `${pdv.name}`, quantity: 1, unitPrice: pdv.price });
    }

    const oneTimeItems = Object.keys(selections)
        .filter(key => selections[key] && ONE_TIME_SERVICES.some(item => item.id === key))
        .map(key => {
            const item = ONE_TIME_SERVICES.find(m => m.id === key)!;
            return { id: item.id, description: item.name, quantity: 1, unitPrice: item.price };
        });

    if (serviceBudget > 0) {
        const totalService = serviceBudget * (1 - serviceDiscount / 100);
        oneTimeItems.push({ id: 'custom_service', description: 'Orçamento de Serviço Adicional', quantity: 1, unitPrice: totalService });
    }

    const quoteData: QuoteData = {
      ...getQuoteMetadata(),
      clientInfo,
      companyInfo: DEFAULT_COMPANY_INFO,
      monthlyItems,
      oneTimeItems,
      discount,
      consultantName,
    };
    
    try {
      const quoteText = await generateQuoteWithAI(quoteData);
      setGeneratedQuote(quoteText);
      setLastQuoteData(quoteData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro desconhecido.');
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleExportPdf = () => {
      if (lastQuoteData && generatedQuote) {
          exportToPdf(lastQuoteData, generatedQuote);
      }
  };

  const handleExportWord = () => {
      if (lastQuoteData && generatedQuote) {
          exportToWord(lastQuoteData, generatedQuote);
      }
  };

  const inputClasses = "w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue focus:border-brand-blue transition duration-150 ease-in-out";
  const checkboxClasses = "h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue";

  const renderModuleGroup = (title: string, items: {id: string, name: string, price: number}[]) => (
    <div key={title}>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
            {items.map(item => (
                <label key={item.id} className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" checked={!!selections[item.id]} onChange={() => handleSelectionChange(item.id)} className={checkboxClasses} />
                    <span className="text-gray-600">{item.name}</span>
                    <span className="text-sm font-medium text-gray-500 ml-auto">R$ {item.price.toFixed(2)}</span>
                </label>
            ))}
        </div>
    </div>
  );


  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Informações da Proposta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" name="consultantName" placeholder="Seu Nome (Vendedor)" value={consultantName} onChange={(e) => setConsultantName(e.target.value)} className={inputClasses} required />
            <input type="text" name="name" placeholder="Nome do Cliente" value={clientInfo.name} onChange={(e) => setClientInfo(prev => ({...prev, name: e.target.value}))} className={inputClasses} required />
            <input type="email" name="email" placeholder="E-mail do Cliente" value={clientInfo.email} onChange={(e) => setClientInfo(prev => ({...prev, email: e.target.value}))} className={inputClasses} required />
            <input type="text" name="phone" placeholder="Telefone do Cliente" value={clientInfo.phone} onChange={(e) => setClientInfo(prev => ({...prev, phone: e.target.value}))} className={inputClasses} />
            <input type="text" name="city" placeholder="Cidade do Cliente" value={clientInfo.city} onChange={(e) => setClientInfo(prev => ({...prev, city: e.target.value}))} className={inputClasses} />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Construa seu orçamento - Tabela 2025</h2>
            
            {renderModuleGroup("Módulos para o seu negócio", MONTHLY_MODULES)}

            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">PDVs Necessários</h3>
                <select value={selectedPdv} onChange={(e) => setSelectedPdv(e.target.value)} className={inputClasses}>
                    {Object.entries(PDV_OPTIONS).map(([key, value]) => (
                        <option key={key} value={key}>{value.name} (+ R$ {value.price.toFixed(2)})</option>
                    ))}
                </select>
            </div>
            
            {renderModuleGroup("Planos Delivery Legal", DELIVERY_PLANS)}
            {renderModuleGroup("Serviços Adicionais (Mensal)", ADDITIONAL_SERVICES)}
            {renderModuleGroup("Serviços (Pagamento Único)", ONE_TIME_SERVICES)}
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Totais e Ajustes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desconto Mensal (%)</label>
                    <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className={inputClasses} min="0" max="100" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento Serviço (Único)</label>
                    <div className="relative">
                        <input type="number" value={serviceBudget} onChange={e => {
                            setServiceBudget(Number(e.target.value));
                            setIsFeeSuggested(false); // User is overriding the suggestion
                        }} className={inputClasses} min="0" />
                        {isFeeSuggested && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded-full">
                                Valor Sugerido
                            </span>
                        )}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desconto Serviço (%)</label>
                    <input type="number" value={serviceDiscount} onChange={e => setServiceDiscount(Number(e.target.value))} className={inputClasses} min="0" max="100" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Multiplicador (meses)</label>
                    <input type="number" value={multiplier} onChange={e => setMultiplier(Number(e.target.value))} className={inputClasses} min="1" />
                </div>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                    <p className="text-sm text-gray-500">Total Mensal</p>
                    <p className="text-xl font-bold text-gray-800">R$ {totalWithDiscount.toFixed(2)}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-500">Total por Dia</p>
                    <p className="text-xl font-bold text-gray-800">R$ {dailyTotal.toFixed(2)}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-500">Total Serviços (Único)</p>
                    <p className="text-xl font-bold text-gray-800">R$ {oneTimeTotal.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Total {multiplier}x Meses</p>
                    <p className="text-xl font-bold text-brand-blue">R$ {multipliedTotal.toFixed(2)}</p>
                </div>
            </div>
        </div>


        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t">
          <div className="text-2xl font-bold text-gray-800">
            Mensal: <span className="text-brand-blue">R$ {totalWithDiscount.toFixed(2)}</span>
            <span className="mx-2 text-gray-400">|</span>
            Serviços: <span className="text-brand-blue">R$ {oneTimeTotal.toFixed(2)}</span>
          </div>
          <button type="submit" disabled={isGenerating} className="w-full md:w-auto px-8 py-3 bg-brand-blue text-white font-bold rounded-lg shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out">
            {isGenerating ? 'Gerando...' : 'Gerar Proposta com IA'}
          </button>
        </div>
      </form>

      {error && <div className="mt-8 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}
      
      {generatedQuote && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Proposta Gerada</h2>
              <div className="flex items-center gap-3">
                  <button onClick={handleExportPdf} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors text-sm">
                      Baixar PDF
                  </button>
                  <button onClick={handleExportWord} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors text-sm">
                      Baixar Word
                  </button>
              </div>
          </div>
          <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap font-sans text-sm leading-relaxed">{generatedQuote}</pre>
        </div>
      )}
    </div>
  );
};