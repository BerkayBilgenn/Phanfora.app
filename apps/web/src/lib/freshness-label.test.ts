import { describe, expect, it } from 'vitest';
import { freshnessBadge } from './freshness-label';

describe('freshnessBadge', () => {
  it('labels live quotes as Canlı', () => {
    expect(freshnessBadge('live', 'live')).toEqual({ text: 'Canlı', tone: 'live' });
  });

  it('labels delayed quotes as Gecikmeli', () => {
    expect(freshnessBadge('delayed', 'delayed')).toEqual({ text: 'Gecikmeli', tone: 'delayed' });
  });

  it('labels official daily prints as Günlük', () => {
    expect(freshnessBadge('end-of-day', 'end-of-day')).toEqual({ text: 'Günlük', tone: 'daily' });
  });
});
