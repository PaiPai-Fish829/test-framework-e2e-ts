export interface User {
  id?: number
  username: string
  email: string
  phone: string
}

export interface Product {
  id: number
  name: string
  price: number
  stock: number
}

export interface Order {
  id: number
  userId: number
  productIds: number[]
  totalAmount: number
  status: 'pending' | 'paid' | 'cancelled' | 'completed'
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  status: number
}
