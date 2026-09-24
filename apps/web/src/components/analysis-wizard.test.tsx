import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AnalysisWizard } from './analysis-wizard';

describe('AnalysisWizard', () => {
  it('validates on continue and submits the normalized three-step request', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    render(<AnalysisWizard currencies={[
      { code: 'TRY', name: 'Türk Lirası', symbol: '₺', minorUnits: 2 },
      { code: 'USD', name: 'ABD Doları', symbol: '$', minorUnits: 2 },
      { code: 'EUR', name: 'Euro', symbol: '€', minorUnits: 2 },
    ]} onSubmit={submit} />);

    await user.click(screen.getByRole('button', { name: 'Devam et' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Geçerli bir tutar gir');

    await user.type(screen.getByLabelText('Değerlendirilecek tutar'), '25.000');
    await user.clear(screen.getByRole('combobox', { name: 'Para birimi' }));
    await user.type(screen.getByRole('combobox', { name: 'Para birimi' }), 'TRY');
    await user.click(screen.getByRole('button', { name: 'Devam et' }));

    await user.click(screen.getByRole('radio', { name: /Haftalık/ }));
    await user.click(screen.getByRole('button', { name: 'Devam et' }));
    await user.click(screen.getByRole('radio', { name: /Dengeli/ }));

    await user.click(screen.getByRole('button', { name: 'Piyasaları tara' }));
    expect(submit).toHaveBeenCalledWith({
      amount: { amount: '25000', currency: 'TRY' },
      horizon: 'weekly',
      riskProfile: 'balanced',
      locale: 'tr-TR',
    });
  });

  it('preserves entered data when moving back', async () => {
    const user = userEvent.setup();
    render(<AnalysisWizard currencies={[
      { code: 'TRY', name: 'Türk Lirası', symbol: '₺', minorUnits: 2 },
    ]} onSubmit={vi.fn()} />);
    await user.type(screen.getByLabelText('Değerlendirilecek tutar'), '12000');
    await user.click(screen.getByRole('button', { name: 'Devam et' }));
    await user.click(screen.getByRole('button', { name: 'Geri' }));
    expect(screen.getByLabelText('Değerlendirilecek tutar')).toHaveValue('12000');
  });
});
