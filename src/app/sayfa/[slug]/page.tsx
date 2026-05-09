'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/common/WhatsAppButton'
import { supabase } from '@/lib/supabase'
import type { StaticPage } from '@/lib/types'
import { sanitizeHtml } from '@/lib/sanitize'

export default function StaticPageDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [page, setPage] = useState<StaticPage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPage() {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        console.error('Supabase fetch error ([slug]):', error)
      }

      if (data) {
        setPage(data)
      }
      setLoading(false)
    }

    fetchPage()
  }, [slug])

  return (
    <>
      <Navbar />

      <main className="pt-[104px] lg:pt-[140px] bg-neutral-50 pb-20 min-h-[70vh]">
        {/* Header Hero */}
        <div className="relative h-40 sm:h-56 bg-neutral-900 overflow-hidden">
          {page?.featured_image ? (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40"
              style={{ backgroundImage: `url(${page.featured_image})` }}
            />
          ) : (
            <>
               <div className="absolute inset-0 bg-gradient-to-r from-primary-900 to-neutral-900" />
               <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-10" />
            </>
          )}
          
          <div className="relative h-full flex flex-col items-center justify-center text-center container-custom">
            <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-white mb-3 animate-slide-up">
              {loading ? 'Yükleniyor...' : page?.title || 'Sayfa Bulunamadı'}
            </h1>
            <div className="flex items-center gap-2 text-sm text-neutral-300 animate-fade-in font-medium">
              <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
              <span>/</span>
              <span className="text-white">Kurumsal</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="container-custom mt-8 sm:mt-12 max-w-4xl">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-neutral-100 overflow-hidden">
            {loading ? (
              <div className="space-y-6">
                <div className="h-8 w-3/4 skeleton rounded-lg" />
                <div className="h-4 w-full skeleton rounded" />
                <div className="h-4 w-full skeleton rounded" />
                <div className="h-4 w-5/6 skeleton rounded" />
                <div className="h-4 w-full skeleton rounded" />
                <div className="h-4 w-4/6 skeleton rounded" />
              </div>
            ) : !page ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
                <h3 className="text-2xl font-bold font-heading text-neutral-800 mb-2">İçerik Hazırlanıyor</h3>
                <p className="text-neutral-500 mb-8 max-w-md mx-auto">
                  Aradığınız politika veya sözleşme sayfası henüz hazırlanmamış veya yayından kaldırılmış olabilir.
                </p>
                <Link href="/" className="btn btn-outline">
                  <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
                </Link>
              </div>
            ) : (
              <div
                className="prose prose-neutral prose-primary max-w-none prose-headings:font-heading prose-headings:font-bold prose-p:text-neutral-600 prose-p:leading-relaxed prose-a:text-primary-600 prose-li:text-neutral-600 [&_*]:break-words [&_*]:overflow-wrap-anywhere overflow-hidden"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content || '<p>Bu sayfanın içeriği henüz girilmemiştir.</p>') }}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </>
  )
}
