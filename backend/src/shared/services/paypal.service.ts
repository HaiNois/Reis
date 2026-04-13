import axios from 'axios'
import { env } from '../../config/env.js'

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
  purchase_units: Array<{
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

export class PayPalService {
  private clientId: string
  private clientSecret: string

  constructor() {
    this.clientId = env.PAYPAL_CLIENT_ID || ''
    this.clientSecret = env.PAYPAL_CLIENT_SECRET || ''
  }

  private async getAccessToken(): Promise<string> {
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

    return response.data.access_token
  }

  async createOrder(amount: number, currency: string = 'USD', customId?: string): Promise<PayPalOrderResponse> {
    const accessToken = await this.getAccessToken()

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
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data
  }

  async captureOrder(orderId: string): Promise<PayPalCaptureResponse> {
    const accessToken = await this.getAccessToken()

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
  }

  async getOrder(orderId: string): Promise<any> {
    const accessToken = await this.getAccessToken()

    const response = await axios.get(
      `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data
  }

  async verifyWebhook(body: any, headers: Record<string, string>): Promise<boolean> {
    const accessToken = await this.getAccessToken()
    const webhookId = env.PAYPAL_WEBHOOK_ID

    if (!webhookId) {
      console.warn('PAYPAL_WEBHOOK_ID not configured, skipping webhook verification')
      return true
    }

    try {
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
    } catch (error: any) {
      console.error('PayPal webhook verification failed:', error?.response?.data || error.message)
      return false
    }
  }
}

export const paypalService = new PayPalService()
