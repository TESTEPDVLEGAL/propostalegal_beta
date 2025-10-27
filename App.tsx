// FIX: Implemented the main App component to resolve the 'Cannot find name' and module errors.
import React from 'react';
import { Header } from './components/Header.js';
import { QuoteForm } from './components/QuoteForm.js';

function App() {
  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Header />
      <main>
        <QuoteForm />
      </main>
    </div>
  );
}

export default App;