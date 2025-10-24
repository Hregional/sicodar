// src/components/layout/Header.jsx
import React from 'react';

export function Header({ title, subtitle }) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
    </header>
  );
}