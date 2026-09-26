import Link from 'next/link';

export default function HistoryPage() {
  return <div className="section-page empty-page"><span className="empty-mark" aria-hidden="true">↺</span><p className="eyebrow">Analiz geçmişi</p><h1>Henüz kaydedilmiş bir analiz yok.</h1><p>Üretim hesabı ve kalıcı veri katmanı etkinleştirildiğinde önceki analizler metodoloji ve veri snapshot’ıyla burada saklanacak.</p><Link className="button-primary" href="/">Yeni analiz oluştur <span aria-hidden="true">→</span></Link></div>;
}
