export function VisaIcon({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/visa.png" alt="Visa" className={className} />
}

export function MastercardIcon({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/mastercard.png" alt="Mastercard" className={className} />
}

export function TroyIcon({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/troy.png" alt="Troy" className={className} />
  )
}
