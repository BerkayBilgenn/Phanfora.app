'use client';

import { useId, useMemo, useState } from 'react';

import type { CurrencyDefinition } from '@phanfora/domain';

interface CurrencyComboboxProps {
  currencies: readonly CurrencyDefinition[];
  value: string;
  onChange: (currency: string) => void;
}

export function CurrencyCombobox({ currencies, value, onChange }: CurrencyComboboxProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const query = value.trim().toLocaleLowerCase('tr-TR');
    if (!query || currencies.some((currency) => currency.code === value)) {
      return currencies.slice(0, 8);
    }
    return currencies.filter((currency) =>
      `${currency.code} ${currency.name}`.toLocaleLowerCase('tr-TR').includes(query),
    ).slice(0, 8);
  }, [currencies, value]);

  return (
    <div className="currency-combobox">
      <label htmlFor={listId}>Para birimi</label>
      <input
        id={listId}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${listId}-options`}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          onChange(event.target.value.toUpperCase());
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
      />
      {open && matches.length > 0 ? (
        <ul id={`${listId}-options`} role="listbox" className="currency-options">
          {matches.map((currency) => (
            <li key={currency.code} role="option" aria-selected={currency.code === value}>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => {
                onChange(currency.code);
                setOpen(false);
              }}>
                <bdi className="currency-code">{currency.code}</bdi>
                <span>{currency.name}</span>
                <span aria-hidden="true">{currency.symbol}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
