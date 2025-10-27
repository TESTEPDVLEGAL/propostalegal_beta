import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-brand-blue shadow-md text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-light">
            <span className="font-bold">PROPOSTA</span> LEGAL
          </h1>
        </div>
        <h2 className="hidden sm:block text-xl font-semibold text-gray-200">Gerador de Orçamentos</h2>
      </div>
    </header>
  );
};