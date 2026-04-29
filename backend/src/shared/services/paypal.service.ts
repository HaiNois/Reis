import axios, { AxiosError } from 'axios'
import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'

const PAYPAL_API_URL = env.PAYPAL_MODE === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

export interface PayPalOrderResponse {
  id: string
  status: string
  links: Array<{
    href: string
    rel: string
    method: string
  }>
}

export interface PayPalCaptureResponse {
  id: string
  status: string
  payer?: {
    email_address?: string
    name?: { given_name?: string; surname?: string }
    phone?: { phone_number?: { national_number?: string } }
  }
  purchase_units: Array<{
    shipping?: {
      name?: { full_name?: string }
      address?: {
        address_line_1?: string
        address_line_2?: string
        admin_area_1?: string
        admin_area_2?: string
        postal_code?: string
        country_code?: string
      }
    }
    payments: {
      captures: Array<{
        id: string
        status: string
        amount: {
          currency_code: string
          value: string
        }
      }>
    }
  }>
}

export interface PayPalOrderDetails {
  id: string
  status: string
  intent?: string
  purchase_units?: Array<{
    amount?: { currency_code: string; value: string }
    custom_id?: string
  }>
  payer?: {
    email_address?: string
    payer_id?: string
  }
  create_time?: string
  update_time?: string
}

// Retry only on network errors, 429, and 5xx — NOT on 4xx (client errors).
function isRetryable(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  const axiosErr = error as AxiosError
  if (!axiosErr.response) return true // network / timeout
  const status = axiosErr.response.status
  return status === 429 || (status >= 500 && status < 600)
}

async function withRetry<T>(
  fn: () => Promise<T>,
  operation: string,
  maxAttempts = 3
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt === maxAttempts || !isRetryable(err)) {
        throw err
      }
      const delayMs = 250 * 2 ** attempt // 500, 1000, 2000
      logger.warn(
        `PayPal ${operation} failed (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms`
      )
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  throw lastError
}

export class PayPalService {
  private clientId: string
  private clientSecret: string

  constructor() {
    this.clientId = env.PAYPAL_CLIENT_ID || ''
    this.clientSecret = env.PAYPAL_CLIENT_SECRET || ''
  }

  private async getAccessToken(): Promise<string> {
    return withRetry(async () => {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')

      const response = await axios.post(
        `${PAYPAL_API_URL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      return response.data.access_token as string
    }, 'getAccessToken')
  }

  async createOrder(
    amount: number,
    currency: string = 'USD',
    customId?: string
  ): Promise<PayPalOrderResponse> {
    const accessToken = await this.getAccessToken()

    return withRetry(async () => {
      const response = await axios.post<PayPalOrderResponse>(
        `${PAYPAL_API_URL}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: amount.toFixed(2),
              },
              custom_id: customId,
            },
          ],
          application_context: {
            // Ask PayPal to collect/use the buyer's shipping address
            // (returned later in the capture response).
            shipping_preference: 'GET_FROM_FILE',
            user_action: 'PAY_NOW',
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data
    }, 'createOrder')
  }

  async captureOrder(orderId: string): Promise<PayPalCaptureResponse> {
    const accessToken = await this.getAccessToken()

    return withRetry(async () => {
      const response = await axios.post<PayPalCaptureResponse>(
        `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data
    }, 'captureOrder')
  }

  async getOrder(orderId: string): Promise<PayPalOrderDetails> {
    const accessToken = await this.getAccessToken()

    return withRetry(async () => {
      const response = await axios.get<PayPalOrderDetails>(
        `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data
    }, 'getOrder')
  }

  async verifyWebhook(body: unknown, headers: Record<string, unknown>): Promise<boolean> {
    const webhookId = env.PAYPAL_WEBHOOK_ID

    if (!webhookId) {
      // Fail-safe: in production, missing webhook ID must reject the request
      // to prevent forged webhooks from marking orders PAID.
      if (env.NODE_ENV === 'production') {
        logger.error(
          'PAYPAL_WEBHOOK_ID is not configured in production — rejecting webhook'
        )
        return false
      }
      logger.warn(
        'PAYPAL_WEBHOOK_ID not configured, skipping signature verification (non-production only)'
      )
      return true
    }

    try {
      const accessToken = await this.getAccessToken()
      const response = await axios.post(
        `${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`,
        {
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          webhook_id: webhookId,
          webhook_event: body,
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data.verification_status === 'SUCCESS'
    } catch (error) {
      const err = error as AxiosError
      logger.error('PayPal webhook verification failed', {
        message: err.message,
        data: err.response?.data,
      })
      return false
    }
  }
}

export const paypalService = new PayPalService()
