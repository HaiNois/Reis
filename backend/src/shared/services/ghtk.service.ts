import axios from 'axios'
import { env } from '../../config/env.js'

const GHTK_API_URL = 'https://services.giaohangtietkiem.vn/services/shipment/v2'

export interface GhtkTrackingResponse {
  success: boolean
  message: string
  order: {
    label_id: string
    partner_id: string
    status: string
    status_text: string
    created: string
    modified: string
    pick_date: string
    deliver_date: string
    customer_fullname: string
    customer_tel: string
    address: string
    ship_money: number
    pick_money: number
    weight: number
    [key: string]: any
  }
}

// Map GHTK status codes to readable Vietnamese status
export const GHTK_STATUS_MAP: Record<string, string> = {
  '1': 'Chưa tiếp nhận',
  '2': 'Đã tiếp nhận',
  '3': 'Đã lấy hàng',
  '4': 'Đang vận chuyển',
  '5': 'Đã giao hàng',
  '6': 'Giao hàng thất bại',
  '7': 'Đang chuyển hoàn',
  '8': 'Đã chuyển hoàn',
  '9': 'Hủy đơn',
  '-1': 'Đã hủy',
}

export class GhtkService {
  private apiToken: string

  constructor() {
    this.apiToken = env.GHTK_API_TOKEN || ''
  }

  private getHeaders() {
    return {
      'Token': this.apiToken,
      'Content-Type': 'application/json',
    }
  }

  async getTrackingInfo(trackingId: string): Promise<GhtkTrackingResponse> {
    try {
      const response = await axios.get<GhtkTrackingResponse>(
        `${GHTK_API_URL}/${trackingId}`,
        {
          headers: this.getHeaders(),
          timeout: 10000,
        }
      )
      return response.data
    } catch (error: any) {
      if (error.response) {
        // GHTK API returned error
        const { status, data } = error.response
        return {
          success: false,
          message: data?.message || `GHTK API error: ${status}`,
          order: {} as any,
        }
      }
      // Network or other error
      return {
        success: false,
        message: error.message || 'Failed to connect to GHTK API',
        order: {} as any,
      }
    }
  }
}

export const ghtkService = new GhtkService()
