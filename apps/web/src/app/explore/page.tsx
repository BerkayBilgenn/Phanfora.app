const classes = [
  ['Hisse', 'Küresel şirketler ve seçili borsalar', '01'],
  ['Kripto', 'Yüksek likiditeli küresel piyasalar', '02'],
  ['Emtia', 'Değerli metaller ve temel emtialar', '03'],
  ['Döviz', 'Majör ve bölgesel pariteler', '04'],
  ['Endeks', 'Küresel piyasa göstergeleri', '05'],
] as const;

export default function ExplorePage() {
  return <div className="section-page"><header><p className="eyebrow">Varlık evreni</p><h1>Keşfet</h1><p>Phanfora’nın karşılaştırdığı varlık sınıflarını ve veri kapsamını incele.</p></header><div className="class-list">{classes.map(([title, description, number]) => <article key={title}><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div><button type="button" aria-label={`${title} sınıfını aç`}>→</button></article>)}</div><p className="fixture-notice">Demo modunda her sınıf için temsilî ve deterministik veri gösterilir.</p></div>;
}
