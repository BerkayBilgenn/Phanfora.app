import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AnalysisPanel } from './analysis-wizard';

const currencies = [
  { code: 'TRY', name: 'Türk Lirası', symbol: '₺', minorUnits: 2 },
  { code: 'USD', name: 'ABD Doları', symbol: '$', minorUnits: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', minorUnits: 2 },
];

describe('AnalysisPanel', () => {
  it('does not claim a market count until the provider supplies one', () => {
    render(<AnalysisPanel currencies={currencies} onSubmit={vi.fn()} />);
    expect(screen.queryByText(/canlı enstrüman/)).not.toBeInTheDocument();
  });
  it('keeps every analysis control visible and submits in one action', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    render(<AnalysisPanel currencies={currencies} onSubmit={submit} marketCount={5} classCount={1} initialHorizon="weekly" initialRiskProfile="high" />);

    expect(screen.getByRole('heading', { name: 'Analiz ayarları' })).toBeInTheDocument();
    expect(screen.getByLabelText('Değerlendirilecek tutar')).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Para birimi' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Analiz vadesi' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Risk profili' })).toBeVisible();
    expect(screen.getByText('5 enstrüman')).toBeInTheDocument();
    expect(screen.getByText('1 varlık sınıfı')).toBeInTheDocument();
    expect(screen.queryByText('1 / 3')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Devam et' })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Değerlendirilecek tutar'), '25.000');
    await user.click(screen.getByRole('radio', { name: /Haftalık/ }));
    await user.click(screen.getByRole('radio', { name: /Yüksek/ }));
    await user.click(screen.getByRole('button', { name: 'Canlı piyasaları analiz et' }));

    expect(submit).toHaveBeenCalledWith({
      amount: { amount: '25000', currency: 'TRY' },
      horizon: 'weekly',
      riskProfile: 'high',
      locale: 'tr-TR',
    });
  });

  it('shows one validation error and returns focus to an invalid amount', async () => {
    const user = userEvent.setup();
    render(<AnalysisPanel currencies={currencies} onSubmit={vi.fn()} />);
    const amount = screen.getByLabelText('Değerlendirilecek tutar');

    await user.click(screen.getByRole('button', { name: 'Canlı piyasaları analiz et' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Geçerli bir tutar gir');
    expect(amount).toHaveFocus();
  });

  it('keeps values editable without navigating between steps', async () => {
    const user = userEvent.setup();
    render(<AnalysisPanel currencies={currencies} onSubmit={vi.fn()} />);
    const amount = screen.getByLabelText('Değerlendirilecek tutar');

    await user.type(amount, '12000');
    await user.clear(amount);
    await user.type(amount, '18000');
    await user.click(screen.getByRole('radio', { name: /Aylık/ }));
    await user.click(screen.getByRole('radio', { name: /Düşük/ }));

    expect(amount).toHaveValue('18000');
    expect(screen.getByRole('radio', { name: /Aylık/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Düşük/ })).toBeChecked();
  });
});
