import Image from 'next/image'

export function BrandMark() {
  return (
    <span className="brand-mark" aria-label="Phanfora">
      <Image src="/mark.svg" alt="" width={32} height={32} priority />
      <span className="brand-wordmark">Phanfora</span>
    </span>
  )
}
