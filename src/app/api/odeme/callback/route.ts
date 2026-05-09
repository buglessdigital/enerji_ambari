import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyCallbackHash } from '@/lib/tosla'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function POST(request: Request) {
  try {
    // Tosla browser redirect ile form data (application/x-www-form-urlencoded) gönderir
    const contentType = request.headers.get('content-type') ?? ''
    const callbackData: Record<string, string> = {}

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      for (const [key, value] of formData.entries()) {
        callbackData[key] = value.toString()
      }
    } else {
      // JSON fallback
      const json = await request.json()
      Object.assign(callbackData, json)
    }

    const orderId = callbackData.OrderId
    const bankResponseCode = callbackData.BankResponseCode
    const threeDSessionId = callbackData.ThreeDSessionId

    if (!orderId) {
      return NextResponse.redirect(`${SITE_URL}/odeme/sonuc?status=fail`)
    }

    // Siparişi bul
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('order_number', orderId)
      .maybeSingle()

    if (!order) {
      console.error('Tosla callback: sipariş bulunamadı:', orderId)
      return NextResponse.redirect(`${SITE_URL}/odeme/sonuc?status=fail`)
    }

    // Hash doğrulama
    const isValid = verifyCallbackHash(callbackData)
    const isSuccess = isValid && bankResponseCode === '00'

    if (isSuccess) {
      // Ödeme başarılı: siparişi güncelle
      await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_transaction_id: threeDSessionId ?? null,
          status: 'processing',
        })
        .eq('order_number', orderId)

      // Stokları düşür
      const { data: orderItems } = await supabaseAdmin
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', order.id)

      if (orderItems) {
        for (const item of orderItems) {
          const { data: prod } = await supabaseAdmin
            .from('products')
            .select('stock_quantity')
            .eq('id', item.product_id)
            .single()
          if (prod) {
            await supabaseAdmin
              .from('products')
              .update({ stock_quantity: Math.max(0, prod.stock_quantity - item.quantity) })
              .eq('id', item.product_id)
          }
        }
      }

      return NextResponse.redirect(
        `${SITE_URL}/odeme/sonuc?order=${encodeURIComponent(orderId)}&status=success`,
        303
      )
    } else {
      // Ödeme başarısız
      const errorMsg = `BankResponseCode: ${bankResponseCode ?? 'N/A'}, Message: ${callbackData.BankResponseMessage ?? 'N/A'}, HashValid: ${isValid}`
      await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'failed',
          payment_error: errorMsg,
        })
        .eq('order_number', orderId)

      return NextResponse.redirect(
        `${SITE_URL}/odeme/sonuc?order=${encodeURIComponent(orderId)}&status=fail`,
        303
      )
    }
  } catch (err) {
    console.error('Tosla callback hatası:', err)
    return NextResponse.redirect(`${SITE_URL}/odeme/sonuc?status=fail`, 303)
  }
}
