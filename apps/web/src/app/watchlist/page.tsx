import Link from 'next/link';

export default function WatchlistPage() {
  return <div className="section-page empty-page"><span className="empty-mark" aria-hidden="true">◇</span><p className="eyebrow">İzleme listesi</p><h1>Takip ettiğin varlıklar burada görünecek.</h1><p>Bir analiz sonucundaki varlığı izlemeye eklediğinde skor ve veri durumu değişimlerini tek yerde takip edebileceksin.</p><Link className="button-primary" href="/">İlk analizi başlat <span aria-hidden="true">→</span></Link></div>;
}
