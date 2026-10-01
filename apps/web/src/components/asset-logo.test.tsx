import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AssetLogo, assetLogoUrl } from './asset-logo';

describe('AssetLogo', () => {
  it('uses the matching Kraken icon for a discovered crypto asset', () => {
    expect(assetLogoUrl('0G', 'crypto')).toBe('https://assets.kraken.com/marketing/web/icons-uni-webp/s_0g.webp');
    const view = render(<AssetLogo symbol="0G" assetClass="crypto" size={24} />);
    const image = view.container.querySelector('img');
    expect(image).toHaveAttribute('src', 'https://assets.kraken.com/marketing/web/icons-uni-webp/s_0g.webp');
    fireEvent.error(image!);
    expect(view.getByText('0G')).toBeInTheDocument();
  });

  it('does not assign a Kraken crypto icon to an unrelated stock symbol', () => {
    expect(assetLogoUrl('AAPL', 'stock')).toBeNull();
  });
});
