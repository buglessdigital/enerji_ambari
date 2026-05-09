'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, ShoppingCart } from 'lucide-react'
import { Suspense } from 'react'

function SonucIcerik() {
  const params = useSearchParams()
  const router = useRouter()

  const status = params.get('status')
  const orderNumber = params.get('order')
  const isSuccess = status === 'success'

  if (isSuccess) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 max-w-lg w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-9 h-9 text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-heading text-neutral-800">Ödemeniz Alındı!</h2>
          <p className="text-neutral-500 mt-2 text-sm">Siparişiniz başarıyla oluşturuldu ve işleme alındı.</p>
        </div>

        {orderNumber && (
          <div className="bg-neutral-50 rounded-xl p-5 space-y-2 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-neutral-500">Sipariş Numarası</span>
              <span className="font-bold text-neutral-800 font-mono">{orderNumber}</span>
            </div>
          </div>
        )}

        {orderNumber && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-left">
            <p className="font-semibold mb-1">Sipariş numaranızı not alın</p>
            <p>
              Siparişinizi takip etmek için{' '}
              <span className="font-mono font-bold">{orderNumber}</span> numarasını bir yere kaydedin.
            </p>
          </div>
        )}

        <div className="border border-primary-100 bg-primary-50 rounded-xl p-5 text-sm text-left space-y-3">
          <p className="text-neutral-700">Siparişlerinizi kolayca takip etmek ister misiniz?</p>
          <p className="text-neutral-500">Ücretsiz hesap oluşturarak tüm siparişlerinizi tek bir yerden görüntüleyebilirsiniz.</p>
          <a href="/hesabim?tab=register" className="btn btn-primary w-full text-center block">
            Hesap Oluştur ve Siparişleri Takip Et
          </a>
        </div>

        <button
          onClick={() => router.push('/')}
          className="text-sm text-neutral-500 hover:text-neutral-700 underline underline-offset-2"
        >
          Ana sayfaya dön
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 max-w-lg w-full text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
        <XCircle className="w-9 h-9 text-red-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold font-heading text-neutral-800">Ödeme Başarısız</h2>
        <p className="text-neutral-500 mt-2 text-sm">
          Ödeme işlemi tamamlanamadı. Kart bilgilerinizi kontrol edip tekrar deneyebilirsiniz.
        </p>
      </div>

      {orderNumber && (
        <div className="bg-neutral-50 rounded-xl p-4 text-sm text-left">
          <span className="text-neutral-500">Başvuru No: </span>
          <span className="font-mono font-medium text-neutral-700">{orderNumber}</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={() => router.push('/odeme')}
          className="btn btn-primary w-full"
        >
          Tekrar Dene
        </button>
        <button
          onClick={() => router.push('/sepet')}
          className="btn btn-outline w-full flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Sepete Dön
        </button>
      </div>
    </div>
  )
}

export default function SonucPage() {
  return (
    <div className="min-h-[70vh] bg-[#f8f9fa] flex items-center justify-center p-4">
      <Suspense fallback={<div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />}>
        <SonucIcerik />
      </Suspense>
    </div>
  )
}
