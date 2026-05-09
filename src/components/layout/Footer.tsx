'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { VisaIcon, MastercardIcon, TroyIcon } from '@/components/icons/PaymentIcons'
import {
  Phone,
  Mail,
  MapPin,
  Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { SiteSettings } from '@/lib/types'

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single()
      if (data) setSettings(data)
    }
    fetchSettings()
  }, [])

  const siteName = settings?.site_name || 'Enerji Ambarı'
  const phone = settings?.phone || ''
  const email = settings?.email || 'info@enerjidukkani.com'
  const address = settings?.address || 'İzmir, Türkiye'

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      {/* Main Footer Content */}
      <div className="container-custom section">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center sm:-mt-16 sm:-mb-16">
              <Image src="/logo3.png" alt={siteName} width={80} height={80} className="block sm:hidden h-20 w-auto" />
              <Image src="/logo.png" alt={siteName} width={288} height={288} className="hidden sm:block h-72 w-auto mix-blend-screen" />
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Güneş enerjisi sistemleri, inverterler, akü çözümleri ve enerji
              aksesuarları ile sürdürülebilir enerji ihtiyaçlarınızı karşılıyoruz.
              Güvenli alışveriş, hızlı kargo ve teknik destek ile yanınızdayız.
            </p>
            {/* Social Media Icons */}
            <div className="flex items-center gap-3 pt-2">
              {settings?.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-neutral-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              )}
              {settings?.linkedin_url && (
                <a
                  href={settings.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-neutral-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
              )}
              {settings?.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-neutral-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
              )}
              {settings?.youtube_url && (
                <a
                  href={settings.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-neutral-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors"
                  aria-label="YouTube"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M21.582 6.186a2.665 2.665 0 00-1.875-1.884c-1.657-.445-8.292-.445-8.292-.445s-6.635 0-8.292.445a2.665 2.665 0 00-1.875 1.884C.802 7.854.802 12.001.802 12.001s0 4.148.445 5.815a2.665 2.665 0 001.875 1.884c1.657.445 8.292.445 8.292.445s6.635 0 8.292-.445a2.665 2.665 0 001.875-1.884c.445-1.667.445-5.815.445-5.815s0-4.147-.445-5.815zm-11.536 8.528v-5.412l4.981 2.701-4.981 2.711z" clipRule="evenodd" />
                  </svg>
                </a>
              )}
              {/* Show placeholder social icons if no settings loaded yet */}
              {!settings && (
                <>
                  {['Instagram', 'LinkedIn', 'Facebook', 'YouTube'].map(label => (
                    <div key={label} className="w-9 h-9 bg-neutral-800 rounded-lg flex items-center justify-center" aria-label={label}>
                      <div className="w-4 h-4 bg-neutral-700 rounded" />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-heading text-base font-semibold text-white mb-5">
              Hızlı Linkler
            </h3>
            <ul className="space-y-3">
              {[
                { href: '/kategori', label: 'Ürünler' },
                { href: '/hakkimizda', label: 'Hakkımızda' },
                { href: '/iletisim', label: 'İletişim' },
                { href: '/bayilik-basvurusu', label: 'Bayilik Başvurusu' },
                { href: '/hesabim?tab=orders', label: 'Siparişlerim' },
                { href: '/favoriler', label: 'Favorilerim' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-white hover:translate-x-1 inline-flex transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="font-heading text-base font-semibold text-white mb-5">
              Kurumsal & Yasal
            </h3>
            <ul className="space-y-3">
              {[
                { href: '/sayfa/gizlilik-politikasi', label: 'Gizlilik Politikası' },
                { href: '/sayfa/kullanim-kosullari', label: 'Kullanım Koşulları' },
                { href: '/sayfa/iptal-ve-iade', label: 'İptal ve İade Koşulları' },
                { href: '/sayfa/mesafeli-satis-sozlesmesi', label: 'Mesafeli Satış Sözleşmesi' },
                { href: '/sayfa/kvkk-aydinlatma', label: 'KVKK Aydınlatma Metni' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-white hover:translate-x-1 inline-flex transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="font-heading text-base font-semibold text-white mb-5">
              İletişim Bilgileri
            </h3>
            <ul className="space-y-4">
              {phone && (
                <li>
                  <a
                    href={`tel:${phone.replace(/\s/g, '')}`}
                    className="flex items-start gap-3 text-sm text-neutral-400 hover:text-white transition-colors group"
                  >
                    <div className="w-8 h-8 bg-neutral-800 group-hover:bg-primary-600 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs text-neutral-500">Telefon</span>
                      <span>{phone}</span>
                      {settings?.phone_secondary && (
                        <span className="block">{settings.phone_secondary}</span>
                      )}
                    </div>
                  </a>
                </li>
              )}
              <li>
                <a
                  href={`mailto:${email}`}
                  className="flex items-start gap-3 text-sm text-neutral-400 hover:text-white transition-colors group"
                >
                  <div className="w-8 h-8 bg-neutral-800 group-hover:bg-primary-600 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs text-neutral-500">E-posta</span>
                    <span>{email}</span>
                    {settings?.support_email && settings.support_email !== email && (
                      <span className="block">{settings.support_email}</span>
                    )}
                  </div>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-sm text-neutral-400">
                  <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs text-neutral-500">Adres</span>
                    <span style={{ whiteSpace: 'pre-line' }}>{address}</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800">
        <div className="container-custom py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Payment Logos */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-neutral-500 mr-2">Güvenli Ödeme:</span>
              <VisaIcon className="h-7 w-auto" />
              <MastercardIcon className="h-7 w-auto" />
              <TroyIcon className="h-8 w-auto" />
            </div>

            {/* Copyright */}
            <p className="text-xs text-neutral-500">
              © {currentYear} {siteName} - Tüm Hakları Saklıdır.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
