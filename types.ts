// FIX: Defined TypeScript types to resolve 'Cannot find name' errors.
export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface ClientInfo {
  name: string;
  city: string;
  phone: string;
  email: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export interface QuoteData {
  clientInfo: ClientInfo;
  companyInfo: CompanyInfo;
  monthlyItems: QuoteItem[];
  oneTimeItems: QuoteItem[];
  discount: number;
  quoteNumber: string;
  date: string;
  validity: string;
  paymentTerms: string;
  consultantName: string;
}