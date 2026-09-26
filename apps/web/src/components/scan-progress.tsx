const stages = [
  'Piyasalar güncelleniyor',
  'Varlıklar filtreleniyor',
  'Risk uyumu hesaplanıyor',
  'Sonuçlar sıralanıyor',
];

export function ScanProgress() {
  return (
    <section className="scan-view" aria-labelledby="scan-title">
      <p className="eyebrow">Küresel tarama</p>
      <h1 id="scan-title">Piyasalar karşılaştırılıyor.</h1>
      <p>Analiz gerçek iş adımlarını tamamladığında sonuç otomatik açılacak.</p>
      <div className="scan-stages" role="status" aria-live="polite">
        {stages.map((stage, index) => <div key={stage} className={index === 0 ? 'is-active' : ''}><span>{String(index + 1).padStart(2, '0')}</span><strong>{stage}</strong>{index === 0 ? <small>İşleniyor</small> : <small>Bekliyor</small>}</div>)}
      </div>
    </section>
  );
}
