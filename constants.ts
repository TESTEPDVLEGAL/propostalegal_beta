// FIX: Defined constants for initial state to resolve 'Cannot find name' errors.
import { ClientInfo, CompanyInfo } from './types.js';

export const INITIAL_CLIENT_INFO: ClientInfo = {
  name: '',
  city: '',
  phone: '',
  email: '',
};

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'WebAutomação Soluções Digitais',
  address: 'Rua Exemplo, 123, Cidade, Estado, CEP 12345-678',
  phone: '(11) 99999-9999',
  email: 'contato@webautomacao.com',
  website: 'www.webautomacao.com',
};

// --- Product & Service Definitions ---

export const MONTHLY_MODULES = [
  { id: 'cloud', name: 'Cloud', price: 69.99 },
  { id: 'estoque', name: 'Módulo Estoque', price: 73.00 },
  { id: 'fiscal_100', name: 'Módulo Fiscal - Até 100 Notas/Mês', price: 0.00 },
  { id: 'fiscal_plus_100', name: 'Módulo Fiscal - Mais de 100 Notas/Mês', price: 73.00 },
  { id: 'financeiro', name: 'Módulo Financeiro', price: 73.00 },
  { id: 'servico', name: 'Módulo de Serviço', price: 73.00 },
  { id: 'ifood', name: 'Integração Ifood', price: 0.00 },
  { id: 'conta_assinada', name: 'Conta Assinada', price: 0.00 },
  { id: 'pdv_fast', name: 'PDV Legal Fast', price: 249.90 },
  { id: 'mata_ficha', name: 'Mata Ficha', price: 0.00 },
  { id: 'cpf_validation', name: 'Validação de CPF (Auto Atendimento)', price: 37.90 },
  { id: 'pdv_full', name: 'PDV Legal Full (Sugerido)', price: 539.90 },
  { id: 'fidelidade', name: 'Fidelidade Legal', price: 199.90 },
  { id: 'auto_food', name: 'Auto Atendimento Food (por totem)', price: 159.00 },
  { id: 'kds', name: 'KDS - Até 2 Terminais', price: 105.90 },
  { id: 'autopesagem_1', name: 'Auto Pesagem - 1ª Balança', price: 105.90 },
  { id: 'autopesagem_add', name: 'Auto Pesagem - Balanças Adicionais', price: 35.00 },
  { id: 'bi_franqueador_10', name: 'BI Legal - Franqueador - Até 10 Lojas', price: 325.00 },
  { id: 'bi_franqueador_plus_10', name: 'BI Legal - Franqueador - Acima de 10 Lojas', price: 435.00 },
];

export const PDV_OPTIONS: { [key: string]: { name: string, price: number } } = {
  '0': { name: 'Nenhum', price: 0 },
  '1': { name: '1 PDV', price: 38.50 },
  '2': { name: '2 PDVs', price: 38.50 },
  '3': { name: '3 PDVs', price: 97.50 },
  '4': { name: '4 PDVs', price: 97.50 },
  '5': { name: '5 PDVs', price: 97.50 },
  '6': { name: '6 PDVs', price: 216.00 },
  '7': { name: '7 PDVs', price: 216.00 },
  '8': { name: '8 PDVs', price: 216.00 },
  '9': { name: '9 PDVs', price: 216.00 },
  '10': { name: '10 PDVs', price: 216.00 },
};

export const DELIVERY_PLANS = [
  { id: 'delivery_1', name: 'Plano Delivery 1 - Até 25K Transacionado', price: 199.90 },
  { id: 'delivery_2', name: 'Plano Delivery 2 - Acima de 25K Transacionados', price: 279.90 },
];

// Assuming these are monthly as well, based on the context
export const ADDITIONAL_SERVICES = [
    { id: 'add_serv_1', name: 'Serviço Adicional 1', price: 35.50 },
    { id: 'add_serv_2', name: 'Serviço Adicional 2', price: 70.00 },
    { id: 'add_serv_3', name: 'Serviço Adicional 3', price: 130.00 },
    { id: 'bi_loja', name: 'Total de Lojas com BI ativo (por Loja)', price: 165.00 },
];


export const ONE_TIME_SERVICES = [
  { id: 'certificado', name: 'Certificado Digital', price: 214.90 },
];

export const ALL_MONTHLY_ITEMS = [
    ...MONTHLY_MODULES,
    ...DELIVERY_PLANS,
    ...ADDITIONAL_SERVICES,
];