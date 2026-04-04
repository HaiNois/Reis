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

  async createOrder(amount: number, currency: string = 'USD'): Promise<PayPalOrderResponse> {
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
}

export const paypalService = new PayPalService()
