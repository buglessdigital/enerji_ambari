import crypto from 'crypto'

const BASE_URL = process.env.TOSLA_TEST_MODE === 'true'
  ? 'https://prepentegrasyon.tosla.com/api/Payment'
  : 'https://entegrasyon.tosla.com/api/Payment'

function makeHash(apiPass: string, clientId: string, apiUser: string, rnd: string, timeSpan: string): string {
  const hashString = apiPass + clientId + apiUser + rnd + timeSpan
  const bytes = crypto.createHash('sha512').update(hashString).digest()
  return bytes.toString('base64')
}

// Türkiye saati (UTC+3) ile YYYYMMDDHHmmss formatı
function turkishTimeSpan(): string {
  const now = new Date()
  const tr = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    tr.getUTCFullYear().toString() +
    pad(tr.getUTCMonth() + 1) +
    pad(tr.getUTCDate()) +
    pad(tr.getUTCHours()) +
    pad(tr.getUTCMinutes()) +
    pad(tr.getUTCSeconds())
  )
}

export interface ToslaEnrolmentResult {
  Code: number
  Message: string
  ThreeDSessionId: string | null
  TransactionId: string | null
}

// Tosla 3DS oturumu başlatır — kart bilgisi GÖNDERİLMEZ, sadece sipariş bilgisi
export async function createThreeDSession(
  orderId: string,
  totalTL: number,  // Türk Lirası cinsinden, örn: 150.50
  callbackUrl: string,
  installmentCount = 0
): Promise<ToslaEnrolmentResult> {
  const clientId = process.env.TOSLA_CLIENT_ID!
  const apiUser = process.env.TOSLA_API_USER!
  const apiPass = process.env.TOSLA_API_PASS!

  const rnd = crypto.randomBytes(4).readUInt32BE(0).toString()
  const timeSpan = turkishTimeSpan()
  const hash = makeHash(apiPass, clientId, apiUser, rnd, timeSpan)

  // Son iki hane kuruştur: 150.50 TL → "15050"
  const amount = Math.round(totalTL * 100).toString()

  const body = {
    clientId,
    apiUser,
    rnd,
    timeSpan,
    hash,
    callbackUrl,
    isCommission: 0,
    orderId,
    amount,
    currency: 949,  // TRY
    installmentCount,
  }

  const res = await fetch(`${BASE_URL}/threeDPayment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    return { Code: -1, Message: `Tosla HTTP ${res.status}`, ThreeDSessionId: null, TransactionId: null }
  }

  return res.json()
}

// Tosla'nın browser'ı yönlendirdiği form URL'i
export function getProcessCardFormUrl(): string {
  return `${BASE_URL}/ProcessCardForm`
}

// Tosla callback'inin hash'ini doğrular
export function verifyCallbackHash(
  callbackData: Record<string, string>
): boolean {
  const apiPass = process.env.TOSLA_API_PASS!
  const hashParameters = (callbackData.HashParameters ?? '').split(',')

  let hashString = apiPass
  for (const param of hashParameters) {
    hashString += callbackData[param] ?? ''
  }

  const expected = crypto.createHash('sha512').update(hashString).digest('base64')
  return expected === callbackData.Hash
}
