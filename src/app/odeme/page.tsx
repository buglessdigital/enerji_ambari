'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { supabase } from '@/lib/supabase'
import { Lock, MapPin, CreditCard, ChevronRight, ShieldCheck, ImageIcon, ShoppingCart } from 'lucide-react'
import { VisaIcon, MastercardIcon, TroyIcon } from '@/components/icons/PaymentIcons'

interface ThreeDFormData {
  processCardFormUrl: string
  threeDSessionId: string
  cardHolderName: string
  cardNo: string
  expireDate: string  // MM/YY
  cvv: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, cartTotal, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [shippingRate, setShippingRate] = useState(0)
  const [shippingFreeThreshold, setShippingFreeThreshold] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [isReady, setIsReady] = useState(false)

  // Tosla 3DS form auto-submit
  const [threeDFormData, setThreeDFormData] = useState<ThreeDFormData | null>(null)
  const toslaFormRef = useRef<HTMLFormElement>(null)

  const [address, setAddress] = useState({
    fullName: '', phone: '', email: '', city: '', district: '', fullAddress: ''
  })
  const [card, setCard] = useState({
    name: '', number: '', expiry: '', cvc: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function initCheckout() {
      const { data: { session } } = await supabaseBrowser.auth.getSession()
      if (session) setUser(session.user)

      const { data } = await supabase
        .from('site_settings')
        .select('shipping_free_threshold, shipping_flat_rate, whatsapp_number, tax_rate')
        .single()
      if (data) {
        setShippingFreeThreshold(data.shipping_free_threshold ?? 0)
        setShippingRate(data.shipping_flat_rate ?? 0)
        setTaxRate(data.tax_rate ?? 0)
        setWhatsappNumber(data.whatsapp_number || '')
      }
      setIsReady(true)
    }
    initCheckout()
  }, [])

  // Tosla form hazır olduğunda otomatik submit et
  useEffect(() => {
    if (threeDFormData && toslaFormRef.current) {
      toslaFormRef.current.submit()
    }
  }, [threeDFormData])

  if (!isReady) {
    return (
      <div className="min-h-[70vh] bg-neutral-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-center font-medium text-neutral-500 animate-pulse">
            Güvenli bağlantı kuruluyor...
          </div>
        </div>
      </div>
    )
  }

  if (cart.length === 0 && !loading) {
    return (
      <div className="min-h-[70vh] bg-neutral-50 flex items-center justify-center flex-col gap-4">
        <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-500">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-heading">Sepetiniz Boş</h2>
        <p className="text-neutral-500">Ödeme adımına geçmek için önce ürün eklemelisiniz.</p>
        <button onClick={() => router.push('/kategori')} className="btn btn-primary mt-2">Alışverişe Başla</button>
      </div>
    )
  }

  const shippingValue = cartTotal >= shippingFreeThreshold ? 0 : shippingRate
  const taxAmount = cartTotal * (taxRate / 100)
  const grandTotal = cartTotal + taxAmount + shippingValue

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (address.fullName.trim().length < 3) newErrors.fullName = 'Ad soyad en az 3 karakter olmalıdır.'
    if (!/^(05\d{9}|5\d{9}|\+905\d{9})$/.test(address.phone.replace(/\s/g, ''))) newErrors.phone = 'Geçerli bir Türk telefon numarası girin (ör: 05XX XXX XX XX).'
    if (address.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) newErrors.email = 'Geçerli bir e-posta adresi girin.'
    if (!address.city.trim()) newErrors.city = 'İl boş olamaz.'
    if (!address.district.trim()) newErrors.district = 'İlçe boş olamaz.'
    if (!address.fullAddress.trim()) newErrors.fullAddress = 'Açık adres boş olamaz.'
    if (!card.name.trim()) newErrors.cardName = 'Kart üzerindeki isim boş olamaz.'
    if (card.number.replace(/\s/g, '').length !== 16) newErrors.cardNumber = 'Kart numarası 16 haneli olmalıdır.'
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) {
      newErrors.cardExpiry = 'Son kullanma tarihi MM/YY formatında olmalıdır.'
    } else {
      const [mm, yy] = card.expiry.split('/').map(Number)
      const now = new Date()
      const expYear = 2000 + yy
      if (mm < 1 || mm > 12 || expYear < now.getFullYear() || (expYear === now.getFullYear() && mm < now.getMonth() + 1)) {
        newErrors.cardExpiry = 'Kartın son kullanma tarihi geçmiş.'
      }
    }
    if (!/^\d{3,4}$/.test(card.cvc)) newErrors.cardCvc = 'CVC 3 haneli olmalıdır.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!validate()) return

    setLoading(true)
    try {
      const items = cart.map((item: any) => ({
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        variant_label: item.variant_label ?? null,
        quantity: item.quantity,
      }))

      const res = await fetch('/api/odeme/baslat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: {
            fullName: address.fullName,
            phone: address.phone,
            email: address.email || null,
            city: address.city,
            district: address.district,
            fullAddress: address.fullAddress,
          },
          items,
          userId: user?.id ?? null,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Ödeme başlatılamadı. Lütfen tekrar deneyin.')
        setLoading(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      // Sepeti temizle (sipariş oluşturuldu)
      clearCart()

      // Tosla 3DS form'unu hazırla ve otomatik submit et
      setThreeDFormData({
        processCardFormUrl: data.processCardFormUrl,
        threeDSessionId: data.threeDSessionId,
        cardHolderName: card.name.toUpperCase(),
        cardNo: card.number.replace(/\s/g, ''),
        expireDate: card.expiry,  // MM/YY
        cvv: card.cvc,
      })
      // useEffect tetiklenir ve form submit edilir — sayfa Tosla'ya gider
    } catch {
      setError('Sunucu bağlantısı kurulamadı. Lütfen tekrar deneyin.')
      setLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(price)

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '')
    const match = (value.match(/\d{4,16}/g)?.[0] || value)
    const parts = []
    for (let i = 0; i < match.length; i += 4) parts.push(match.substring(i, i + 4))
    setCard({ ...card, number: parts.length ? parts.join(' ') : value })
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pt-8 pb-20">
      {/* Tosla 3DS Hidden Form — useEffect ile otomatik submit edilir */}
      {threeDFormData && (
        <form
          ref={toslaFormRef}
          method="POST"
          action={threeDFormData.processCardFormUrl}
          style={{ display: 'none' }}
        >
          <input type="hidden" name="ThreeDSessionId" value={threeDFormData.threeDSessionId} />
          <input type="hidden" name="CardHolderName" value={threeDFormData.cardHolderName} />
          <input type="hidden" name="CardNo" value={threeDFormData.cardNo} />
          <input type="hidden" name="ExpireDate" value={threeDFormData.expireDate} />
          <input type="hidden" name="Cvv" value={threeDFormData.cvv} />
        </form>
      )}

      <div className="container-custom">
        {/* Adım Takibi */}
        <div className="flex items-center gap-3 text-sm mb-8 font-medium">
          <button onClick={() => router.push('/sepet')} className="text-neutral-500 hover:text-primary-600 transition-colors">Sepetim</button>
          <ChevronRight className="w-4 h-4 text-neutral-300" />
          <span className="text-primary-600 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Güvenli Ödeme</span>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleCheckout} className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Sol: Form Alanları */}
          <div className="w-full lg:flex-1 space-y-6">

            {/* Teslimat Adresi */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-neutral-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold font-heading">Teslimat Adresi</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Ad Soyad *</label>
                  <input type="text" required value={address.fullName} onChange={e => setAddress({...address, fullName: e.target.value})} className="input" placeholder="Örn: Ahmet Yılmaz" />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Telefon Numarası *</label>
                  <input type="tel" required value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} className="input" placeholder="05XX XXX XX XX" />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
                {!user && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-neutral-700">E-posta Adresi <span className="text-neutral-400 font-normal">(Sipariş Takibi İçin İsteğe Bağlı)</span></label>
                    <input type="email" value={address.email} onChange={e => setAddress({...address, email: e.target.value})} className="input" placeholder="orn: ahmet@gmail.com" />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">İl *</label>
                  <input type="text" required value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="input" placeholder="Örn: İstanbul" />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">İlçe *</label>
                  <input type="text" required value={address.district} onChange={e => setAddress({...address, district: e.target.value})} className="input" placeholder="Örn: Kadıköy" />
                  {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Açık Adres *</label>
                  <textarea required value={address.fullAddress} onChange={e => setAddress({...address, fullAddress: e.target.value})} className="input min-h-[100px] resize-y" placeholder="Mahalle, sokak, bina ve daire no..." />
                  {errors.fullAddress && <p className="text-red-500 text-sm mt-1">{errors.fullAddress}</p>}
                </div>
              </div>
            </div>

            {/* Ödeme Bilgileri */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-neutral-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center text-accent-500">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold font-heading">Ödeme Bilgileri</h2>
                </div>
                <div className="flex items-center gap-2">
                  <VisaIcon className="h-6 w-auto" />
                  <MastercardIcon className="h-6 w-auto" />
                  <TroyIcon className="h-6 w-auto" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Kart Üzerindeki İsim *</label>
                  <input type="text" required value={card.name} onChange={e => setCard({...card, name: e.target.value})} className="input font-mono uppercase" placeholder="AHMET YILMAZ" />
                  {errors.cardName && <p className="text-red-500 text-sm mt-1">{errors.cardName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Kart Numarası *</label>
                  <div className="relative">
                    <input type="text" required value={card.number} onChange={handleCardNumberChange} maxLength={19} className="input font-mono pl-10 tracking-widest" placeholder="0000 0000 0000 0000" />
                    <CreditCard className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">Son Kullanma (AA/YY) *</label>
                    <input type="text" required value={card.expiry} onChange={e => setCard({...card, expiry: e.target.value})} maxLength={5} className="input font-mono" placeholder="MM/YY" />
                    {errors.cardExpiry && <p className="text-red-500 text-sm mt-1">{errors.cardExpiry}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">CVC *</label>
                    <input type="text" required value={card.cvc} onChange={e => setCard({...card, cvc: e.target.value})} maxLength={4} className="input font-mono" placeholder="123" />
                    {errors.cardCvc && <p className="text-red-500 text-sm mt-1">{errors.cardCvc}</p>}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                <p>Kart bilgileriniz 256-bit SSL ile şifrelenerek Tosla güvenli ödeme altyapısı üzerinden işlenir. Bu site kart bilgilerinizi kaydetmez.</p>
              </div>
            </div>
          </div>

          {/* Sağ: Sipariş Özeti */}
          <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 sticky top-28">
            <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100">
              <h2 className="text-lg font-bold font-heading mb-4 border-b border-neutral-100 pb-4">Sipariş Özeti</h2>

              <div className="max-h-[300px] overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                {cart.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 relative">
                      {item.image_url ? (
                        <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 text-neutral-400" /></div>
                      )}
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-neutral-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold z-10">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-neutral-800 line-clamp-2">{item.name}</p>
                      <p className="text-sm font-medium text-primary-600 mt-1">{formatPrice(item.dealer_price ?? item.sale_price ?? item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-neutral-600 text-sm">
                  <span>Ara Toplam</span>
                  <span className="font-medium">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600 text-sm">
                  <span>KDV (%{taxRate})</span>
                  <span className="font-medium">{formatPrice(taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600 text-sm">
                  <span>Kargo Ücreti</span>
                  {shippingValue === 0 ? (
                    <span className="font-bold text-green-600">Ücretsiz</span>
                  ) : (
                    <span className="font-medium">{formatPrice(shippingValue)}</span>
                  )}
                </div>
                <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
                  <span className="font-bold text-neutral-800">Genel Toplam</span>
                  <span className="font-bold text-xl text-primary-600 font-heading">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full mt-6 py-4 text-base relative shadow-lg shadow-primary-500/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    3D Secure'e Yönlendiriliyor...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    Güvenli Ödeme Yap
                  </span>
                )}
              </button>
            </div>

            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\s/g, '').replace(/^\+/, '').replace(/^0/, '90')}?text=${encodeURIComponent('Merhaba, siparişim hakkında yardım almak istiyorum.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-4 mt-4 bg-white border border-neutral-100 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-green-200 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#e7faf0' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-5 h-5" style={{ fill: '#25D366' }}>
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-800">Sipariş hakkında yardım mı lazım?</p>
                  <p className="text-xs text-neutral-500 mt-0.5">WhatsApp üzerinden bize ulaşın</p>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-green-500 transition-colors shrink-0" />
              </a>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
