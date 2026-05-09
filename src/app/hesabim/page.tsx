'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, User, MapPin, Package, LogOut, Settings, Plus, Trash2, Pencil, ChevronRight, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const EMPTY_ADDRESS = {
  label: '',
  full_name: '',
  phone: '',
  city: '',
  district: '',
  neighborhood: '',
  address_line: '',
  zip_code: '',
  is_default: false,
  address_type: 'shipping' as 'shipping' | 'billing' | 'both',
}

function AccountPageInner() {
  const searchParams = useSearchParams()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses'>(
    (searchParams.get('tab') as 'profile' | 'orders' | 'addresses') || 'profile'
  )

  // Auth State
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Profile State
  const [profile, setProfile] = useState<any>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [resetSending, setResetSending] = useState(false)
  const [resetMessage, setResetMessage] = useState('')

  // Addresses State
  const [addresses, setAddresses] = useState<any[]>([])
  const [addressModal, setAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const [addressForm, setAddressForm] = useState({ ...EMPTY_ADDRESS })
  const [addressSaving, setAddressSaving] = useState(false)
  const [addressError, setAddressError] = useState('')

  // Orders State
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabaseBrowser.auth.getSession()
      setSession(session)

      if (session) {
        fetchProfile(session.user.id)
        fetchAddresses(session.user.id)
        fetchOrders(session.user.id)
      }
      setLoading(false)

      const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        if (session) {
          fetchProfile(session.user.id)
          fetchAddresses(session.user.id)
          fetchOrders(session.user.id)
        }
      })
      return () => subscription.unsubscribe()
    }
    checkAuth()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabaseBrowser.from('profiles').select('*').eq('id', userId).single()
    if (data) setProfile(data)
  }

  async function fetchAddresses(userId: string) {
    const { data } = await supabaseBrowser.from('addresses').select('*').eq('user_id', userId).order('is_default', { ascending: false }).order('created_at', { ascending: false })
    if (data) setAddresses(data)
  }

  async function fetchOrders(userId: string) {
    const { data } = await supabaseBrowser.from('orders').select('*, items:order_items(count)').eq('user_id', userId).order('created_at', { ascending: false })
    if (data) setOrders(data)
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    if (isLogin) {
      const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password })
      if (error) setAuthError(error.message)
    } else {
      const { error } = await supabaseBrowser.auth.signUp({
        email, password,
        options: { data: { full_name: name, role: 'customer' } }
      })
      if (error) setAuthError(error.message)
      else setAuthError('Kayıt başarılı! Lütfen e-postanızı kontrol edin.')
    }
    setAuthLoading(false)
  }

  const handleGoogleLogin = async () => {
    setAuthLoading(true)
    setAuthError('')
    const { error } = await supabaseBrowser.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/hesabim` }
    })
    if (error) { setAuthError(error.message); setAuthLoading(false) }
  }

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut()
    setSession(null)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileSuccess('')
    const { error } = await supabaseBrowser.from('profiles').update({
      full_name: profile.full_name,
      phone: profile.phone,
    }).eq('id', session.user.id)
    if (!error) setProfileSuccess('Bilgileriniz başarıyla güncellendi.')
    setSavingProfile(false)
  }

  const deleteAddress = async (id: string) => {
    if (!confirm('Silmek istediğinizden emin misiniz?')) return
    await supabaseBrowser.from('addresses').delete().eq('id', id)
    fetchAddresses(session.user.id)
  }

  function openAddModal() {
    setEditingAddress(null)
    setAddressForm({ ...EMPTY_ADDRESS })
    setAddressError('')
    setAddressModal(true)
  }

  function openEditModal(address: any) {
    setEditingAddress(address)
    setAddressForm({
      label: address.label || '',
      full_name: address.full_name || '',
      phone: address.phone || '',
      city: address.city || '',
      district: address.district || '',
      neighborhood: address.neighborhood || '',
      address_line: address.address_line || '',
      zip_code: address.zip_code || '',
      is_default: address.is_default || false,
      address_type: address.address_type || 'shipping',
    })
    setAddressError('')
    setAddressModal(true)
  }

  const handleAddressSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddressSaving(true)
    setAddressError('')

    // Varsayılan yapılıyorsa önce diğerlerini sıfırla
    if (addressForm.is_default) {
      await supabaseBrowser.from('addresses').update({ is_default: false }).eq('user_id', session.user.id)
    }

    // Prepare payload to match database schema exactly
    const payload = {
      label: addressForm.label,
      full_name: addressForm.full_name,
      phone: addressForm.phone,
      city: addressForm.city,
      district: addressForm.district,
      address_line: addressForm.address_line,
      zip_code: addressForm.zip_code || null,
      is_default: addressForm.is_default,
      address_type: addressForm.address_type,
    }

    // Include neighborhood in address_line if provided (since it's not in DB schema)
    if (addressForm.neighborhood && !payload.address_line.includes(addressForm.neighborhood)) {
      payload.address_line = `${addressForm.neighborhood} Mah. ${payload.address_line}`
    }

    let error
    if (editingAddress) {
      const result = await supabaseBrowser.from('addresses').update({
        ...payload,
        updated_at: new Date().toISOString(),
      }).eq('id', editingAddress.id)
      error = result.error
    } else {
      const result = await supabaseBrowser.from('addresses').insert({
        ...payload,
        user_id: session.user.id,
      })
      error = result.error
    }

    setAddressSaving(false)
    if (error) {
      console.error("Address save error:", error)
      setAddressError(`Adres kaydedilirken bir hata oluştu: ${error.message || error.details || JSON.stringify(error)}`)
    } else {
      setAddressModal(false)
      fetchAddresses(session.user.id)
    }
  }

  if (loading) {
    return (
      <div className="pt-32 pb-20 bg-neutral-50 min-h-screen">
        <Navbar />
        <div className="container-custom">
          <div className="h-96 w-full skeleton rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />

      <main className="pt-[104px] lg:pt-[140px] bg-neutral-50 min-h-screen pb-20">
        <div className="container-custom">
          {!session ? (
            /* Auth Form (Login / Register) */
            <div className="max-w-md mx-auto mt-10">
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-100">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-neutral-900 font-heading mb-2">
                    {isLogin ? 'Hoş Geldiniz' : 'Hesap Oluştur'}
                  </h1>
                  <p className="text-sm text-neutral-500">
                    {isLogin ? 'Devam etmek için giriş yapın.' : 'Ayrıcalıklardan faydalanmak için kayıt olun.'}
                  </p>
                </div>

                {authError && (
                  <div className={`p-4 rounded-xl text-sm font-medium mb-6 ${authError.includes('başarılı') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {authError}
                  </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-neutral-700">Ad Soyad</label>
                      <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Ad Soyad" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">E-Posta Adresi</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="ornek@mail.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">Şifre</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="input pr-10" placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {isLogin && (
                    <div className="flex justify-end">
                      <button type="button" className="text-sm text-primary-600 font-medium hover:underline">Şifremi Unuttum</button>
                    </div>
                  )}

                  <button type="submit" disabled={authLoading} className="btn btn-primary w-full py-3 mt-4">
                    {authLoading ? 'Lütfen Bekleyin...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
                  </button>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-neutral-200"></div>
                    <span className="flex-shrink-0 mx-4 text-neutral-400 text-sm font-medium">veya</span>
                    <div className="flex-grow border-t border-neutral-200"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={authLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors font-bold text-neutral-700"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google ile {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                  </button>
                </form>

                <div className="mt-8 pt-8 border-t border-neutral-100 text-center">
                  <p className="text-sm text-neutral-600">
                    {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
                    <button type="button" onClick={() => { setIsLogin(!isLogin); setAuthError('') }} className="ml-1 font-bold text-primary-600 hover:underline">
                      {isLogin ? 'Hemen Üye Ol' : 'Giriş Yap'}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Dashboard Layout */
            <div className="flex flex-col lg:flex-row gap-8">

              {/* Sidebar Menu */}
              <div className="lg:w-1/4">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 sticky top-32">
                  <div className="flex flex-col items-center text-center pb-6 mt-4 border-b border-neutral-100">
                    <div className="w-20 h-20 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-2xl font-bold mb-3">
                      {profile?.full_name?.charAt(0) || <User />}
                    </div>
                    <h2 className="font-bold text-neutral-900">{profile?.full_name || 'Kullanıcı'}</h2>
                    <p className="text-sm text-neutral-500">{session.user.email}</p>
                  </div>
                  <nav className="flex flex-col gap-1 pt-6">
                    <button onClick={() => setActiveTab('profile')} className={`flex items-center justify-between p-3 rounded-xl transition-all font-medium ${activeTab === 'profile' ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-50'}`}>
                      <span className="flex items-center gap-3"><Settings className="w-5 h-5" /> Profil Bilgilerim</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'profile' ? 'translate-x-1' : ''}`} />
                    </button>
                    <button onClick={() => setActiveTab('addresses')} className={`flex items-center justify-between p-3 rounded-xl transition-all font-medium ${activeTab === 'addresses' ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-50'}`}>
                      <span className="flex items-center gap-3"><MapPin className="w-5 h-5" /> Adreslerim</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'addresses' ? 'translate-x-1' : ''}`} />
                    </button>
                    <button onClick={() => setActiveTab('orders')} className={`flex items-center justify-between p-3 rounded-xl transition-all font-medium ${activeTab === 'orders' ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-50'}`}>
                      <span className="flex items-center gap-3"><Package className="w-5 h-5" /> Siparişlerim</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'orders' ? 'translate-x-1' : ''}`} />
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-xl transition-all font-medium text-red-500 hover:bg-red-50 mt-4">
                      <LogOut className="w-5 h-5" /> Çıkış Yap
                    </button>
                  </nav>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="lg:w-3/4">

                {/* Profile Tab */}
                {activeTab === 'profile' && profile && (
                  <div className="bg-white rounded-3xl p-6 lg:p-10 shadow-sm border border-neutral-100 animate-slide-up">
                    <h2 className="text-2xl font-bold text-neutral-900 font-heading mb-6">Profil Bilgilerim</h2>
                    {profileSuccess && <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium mb-6">{profileSuccess}</div>}

                    <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-xl">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700">E-Posta (Değiştirilemez)</label>
                        <input type="text" value={session.user.email} disabled className="input bg-neutral-100 text-neutral-500 cursor-not-allowed" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700">Ad Soyad</label>
                        <input type="text" value={profile.full_name || ''} onChange={e => setProfile({ ...profile, full_name: e.target.value })} className="input" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700">Telefon Numarası</label>
                        <input type="text" value={profile.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="input" placeholder="05XXXXXXXXX" />
                      </div>
                      <button type="submit" disabled={savingProfile} className="btn btn-primary mt-4 px-8">
                        {savingProfile ? 'Kaydediliyor...' : 'Bilgilerimi Güncelle'}
                      </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-neutral-100 max-w-xl">
                      <h3 className="text-lg font-bold text-neutral-900 mb-4">Şifre Değiştir</h3>
                      {resetMessage && (
                        <div className={`p-4 rounded-xl text-sm font-medium mb-4 ${resetMessage.includes('gönderildi') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {resetMessage}
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={resetSending}
                        onClick={async () => {
                          setResetSending(true)
                          setResetMessage('')
                          const { error } = await supabaseBrowser.auth.resetPasswordForEmail(session.user.email, {
                            redirectTo: `${window.location.origin}/hesabim/sifre-guncelle`,
                          })
                          setResetMessage(error ? 'Bir hata oluştu, lütfen tekrar deneyin.' : 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.')
                          setResetSending(false)
                        }}
                        className="btn btn-outline text-sm"
                      >
                        {resetSending ? 'Gönderiliyor...' : 'Şifre Sıfırlama Bağlantısı Gönder'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Addresses Tab */}
                {activeTab === 'addresses' && (
                  <div className="bg-white rounded-3xl p-6 lg:p-10 shadow-sm border border-neutral-100 animate-slide-up">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-neutral-900 font-heading">Kayıtlı Adreslerim</h2>
                      <button onClick={openAddModal} className="btn btn-primary btn-sm">
                        <Plus className="w-4 h-4" /> Yeni Adres Ekle
                      </button>
                    </div>

                    {addresses.length === 0 ? (
                      <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-neutral-100 border-dashed">
                        <MapPin className="w-10 h-10 mx-auto text-neutral-300 mb-3" />
                        <p className="text-neutral-500 mb-4">Henüz kayıtlı bir adresiniz bulunmuyor.</p>
                        <button onClick={openAddModal} className="btn btn-outline btn-sm">İlk Adresimi Ekle</button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {addresses.map(address => (
                          <div key={address.id} className="border border-neutral-200 rounded-2xl p-5 hover:border-primary-300 transition-colors bg-white relative group">
                            {address.is_default && (
                              <span className="absolute -top-3 left-4 bg-primary-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">Varsayılan</span>
                            )}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-bold text-neutral-900">{address.label}</h3>
                              <span className="text-xs font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full shrink-0">
                                {address.address_type === 'shipping' ? 'Teslimat' : address.address_type === 'billing' ? 'Fatura' : 'Her İkisi'}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-neutral-700">{address.full_name}</p>
                            <p className="text-sm text-neutral-500 mt-1">{address.phone}</p>
                            <p className="text-sm text-neutral-500 mt-2 mb-3 leading-relaxed">{address.address_line}</p>
                            <p className="text-sm font-medium text-neutral-800">{address.district} / {address.city}</p>

                            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-neutral-100">
                              <button
                                onClick={() => openEditModal(address)}
                                className="text-sm text-primary-600 font-medium hover:underline flex items-center gap-1"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Düzenle
                              </button>
                              <button
                                onClick={() => deleteAddress(address.id)}
                                className="text-sm text-red-500 font-medium hover:underline flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Sil
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div className="bg-white rounded-3xl p-6 lg:p-10 shadow-sm border border-neutral-100 animate-slide-up">
                    <h2 className="text-2xl font-bold text-neutral-900 font-heading mb-8">Siparişlerim</h2>

                    {orders.length === 0 ? (
                      <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-neutral-100 border-dashed">
                        <Package className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                        <h3 className="text-lg font-bold text-neutral-800 mb-2">Henüz Siparişiniz Yok</h3>
                        <p className="text-neutral-500 mb-6">Daha önce hiçbir sipariş vermemişsiniz.</p>
                        <Link href="/" className="btn btn-primary">Alışverişe Başla</Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map(order => (
                          <div key={order.id} className="border border-neutral-200 rounded-2xl p-5 md:p-6 hover:border-primary-300 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-neutral-100">
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="font-mono font-bold text-neutral-900">{order.order_number}</span>
                                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase
                                    ${order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                      order.status === 'processing' || order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                      'bg-red-100 text-red-700'}
                                  `}>
                                    {order.status === 'pending' ? 'Onay Bekliyor' :
                                     order.status === 'processing' ? 'Hazırlanıyor' :
                                     order.status === 'shipped' ? 'Kargoya Verildi' :
                                     order.status === 'delivered' ? 'Teslim Edildi' : 'İptal Edildi'}
                                  </span>
                                </div>
                                <p className="text-sm text-neutral-500">{new Date(order.created_at).toLocaleDateString('tr-TR')} tarihinde verildi</p>
                              </div>
                              <div className="text-left md:text-right">
                                <p className="text-sm text-neutral-500 mb-0.5">Sipariş Tutarı</p>
                                <p className="font-bold text-lg text-primary-700">
                                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.total)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <p className="text-sm text-neutral-700"><span className="font-bold">{order.items[0]?.count || 0}</span> farklı ürün bulunuyor.</p>
                              <Link href={`/hesabim/siparis/${order.id}`} className="btn btn-outline btn-sm">Detayları Gör</Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </main>

      {/* Address Modal */}
      {addressModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAddressModal(false)} />
          <div className="relative bg-white w-full sm:max-w-xl sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 shrink-0">
              <h3 className="text-lg font-bold text-neutral-900 font-heading">
                {editingAddress ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
              </h3>
              <button onClick={() => setAddressModal(false)} className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddressSave} className="overflow-y-auto">
              <div className="p-6 space-y-4">

                {/* Adres Etiketi + Tür */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">Adres Başlığı <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Ev, İş..."
                      value={addressForm.label}
                      onChange={e => setAddressForm(f => ({ ...f, label: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">Adres Türü</label>
                    <select
                      value={addressForm.address_type}
                      onChange={e => setAddressForm(f => ({ ...f, address_type: e.target.value as any }))}
                      className="input"
                    >
                      <option value="shipping">Teslimat</option>
                      <option value="billing">Fatura</option>
                      <option value="both">Her İkisi</option>
                    </select>
                  </div>
                </div>

                {/* Ad Soyad + Telefon */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">Ad Soyad <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={addressForm.full_name}
                      onChange={e => setAddressForm(f => ({ ...f, full_name: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">Telefon <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      required
                      placeholder="05XXXXXXXXX"
                      value={addressForm.phone}
                      onChange={e => setAddressForm(f => ({ ...f, phone: e.target.value }))}
                      className="input"
                    />
                  </div>
                </div>

                {/* Şehir + İlçe */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">Şehir <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="İstanbul"
                      value={addressForm.city}
                      onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">İlçe <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={addressForm.district}
                      onChange={e => setAddressForm(f => ({ ...f, district: e.target.value }))}
                      className="input"
                    />
                  </div>
                </div>

                {/* Mahalle + Posta Kodu */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">Mahalle</label>
                    <input
                      type="text"
                      value={addressForm.neighborhood}
                      onChange={e => setAddressForm(f => ({ ...f, neighborhood: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">Posta Kodu</label>
                    <input
                      type="text"
                      placeholder="34000"
                      value={addressForm.zip_code}
                      onChange={e => setAddressForm(f => ({ ...f, zip_code: e.target.value }))}
                      className="input"
                    />
                  </div>
                </div>

                {/* Açık Adres */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700">Açık Adres <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Sokak, apartman, kat, daire..."
                    value={addressForm.address_line}
                    onChange={e => setAddressForm(f => ({ ...f, address_line: e.target.value }))}
                    className="input resize-none"
                  />
                </div>

                {/* Varsayılan */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addressForm.is_default}
                    onChange={e => setAddressForm(f => ({ ...f, is_default: e.target.checked }))}
                    className="w-4 h-4 accent-primary-600 rounded"
                  />
                  <span className="text-sm font-medium text-neutral-700">Varsayılan adres olarak ayarla</span>
                </label>

                {addressError && (
                  <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">{addressError}</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-neutral-100 flex gap-3 shrink-0">
                <button type="button" onClick={() => setAddressModal(false)} className="btn btn-outline flex-1">
                  İptal
                </button>
                <button type="submit" disabled={addressSaving} className="btn btn-primary flex-1">
                  {addressSaving ? 'Kaydediliyor...' : (editingAddress ? 'Güncelle' : 'Adresi Kaydet')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountPageInner />
    </Suspense>
  )
}
