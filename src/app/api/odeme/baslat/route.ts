import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createThreeDSession, getProcessCardFormUrl } from '@/lib/tosla'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { address, items, userId } = body as {
      address: {
        fullName: string
        phone: string
        email?: string
        city: string
        district: string
        fullAddress: string
      }
      items: Array<{ product_id: string; variant_id?: string; variant_label?: string; quantity: number }>
      userId?: string
    }

    if (!address || !items?.length) {
      return NextResponse.json({ error: 'Geçersiz istek verisi.' }, { status: 400 })
    }

    // 1. Ürün fiyatlarını DB'den çek (client'tan gelen fiyata güvenme)
    const productIds = items.map(i => i.product_id)
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, price, sale_price, dealer_price, dealer_sale_price, stock_quantity, name')
      .in('id', productIds)

    if (productsError || !products) {
      return NextResponse.json({ error: 'Ürün bilgileri alınamadı.' }, { status: 500 })
    }

    // 2. Bayi indirimi için kullanıcı rolünü kontrol et
    let dealerDiscountRate: number | null = null
    if (userId) {
      const { data: dealerData } = await supabaseAdmin
        .from('dealers')
        .select('discount_rate')
        .eq('user_id', userId)
        .maybeSingle()
      if (dealerData) dealerDiscountRate = dealerData.discount_rate
    }

    // 3. Stok kontrolü ve sunucu taraflı toplam hesaplama
    const productMap = new Map(products.map(p => [p.id, p]))
    let subtotal = 0
    const orderItemsPayload = []

    for (const item of items) {
      const product = productMap.get(item.product_id)
      if (!product) {
        return NextResponse.json({ error: `Ürün bulunamadı: ${item.product_id}` }, { status: 400 })
      }
      if (product.stock_quantity < item.quantity) {
        return NextResponse.json({ error: `"${product.name}" ürününde yeterli stok yok.` }, { status: 400 })
      }

      let unitPrice: number
      if (dealerDiscountRate !== null) {
        const base = product.dealer_sale_price ?? product.dealer_price
        if (base) {
          unitPrice = base
        } else {
          unitPrice = (product.sale_price ?? product.price) * (1 - dealerDiscountRate / 100)
        }
      } else {
        unitPrice = product.sale_price ?? product.price
      }

      subtotal += unitPrice * item.quantity
      orderItemsPayload.push({
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: unitPrice * item.quantity,
        variant_info: item.variant_label ?? null,
      })
    }

    // 4. Kargo ve vergi ayarları
    const { data: settings } = await supabaseAdmin
      .from('site_settings')
      .select('shipping_free_threshold, shipping_flat_rate, tax_rate')
      .single()

    const shippingFreeThreshold = settings?.shipping_free_threshold ?? 0
    const shippingRate = settings?.shipping_flat_rate ?? 0
    const taxRate = settings?.tax_rate ?? 0

    const shippingCost = subtotal >= shippingFreeThreshold ? 0 : shippingRate
    const taxAmount = subtotal * (taxRate / 100)
    const grandTotal = subtotal + taxAmount + shippingCost

    // 5. Adres kaydı oluştur
    const { data: addressData, error: addressError } = await supabaseAdmin
      .from('addresses')
      .insert({
        user_id: userId ?? null,
        label: 'Teslimat Adresi',
        full_name: address.fullName,
        phone: address.phone,
        city: address.city,
        district: address.district,
        address_line: address.fullAddress,
        address_type: 'both',
        is_default: false,
      })
      .select()
      .single()

    if (addressError || !addressData) {
      return NextResponse.json({ error: 'Adres kaydedilemedi.' }, { status: 500 })
    }

    // 6. Bekleyen siparişi oluştur
    const orderNumber = 'ENR-' + Date.now().toString().slice(-8)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId ?? null,
        status: 'pending',
        payment_method: 'credit_card',
        payment_status: 'pending',
        subtotal,
        tax_amount: taxAmount,
        shipping_cost: shippingCost,
        total: grandTotal,
        shipping_address_id: addressData.id,
        billing_address_id: addressData.id,
      })
      .select()
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Sipariş oluşturulamadı.' }, { status: 500 })
    }

    // 7. Sipariş kalemlerini ekle
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsPayload.map(item => ({ ...item, order_id: order.id })))

    if (itemsError) {
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Sipariş kalemleri eklenemedi.' }, { status: 500 })
    }

    // 8. Tosla 3DS oturumu başlat
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const callbackUrl = `${siteUrl}/api/odeme/callback`

    const toslaResult = await createThreeDSession(orderNumber, grandTotal, callbackUrl)

    if (toslaResult.Code !== 0 || !toslaResult.ThreeDSessionId) {
      // Tosla'dan hata geldi — siparişi sil
      await supabaseAdmin.from('order_items').delete().eq('order_id', order.id)
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { error: toslaResult.Message || 'Ödeme başlatılamadı. Lütfen tekrar deneyin.' },
        { status: 400 }
      )
    }

    // 9. ThreeDSessionId'yi siparişe kaydet
    await supabaseAdmin
      .from('orders')
      .update({ payment_transaction_id: toslaResult.ThreeDSessionId })
      .eq('id', order.id)

    return NextResponse.json({
      success: true,
      threeDSessionId: toslaResult.ThreeDSessionId,
      processCardFormUrl: getProcessCardFormUrl(),
      orderNumber,
      total: grandTotal,
    })
  } catch (err: unknown) {
    console.error('Ödeme başlatma hatası:', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
