import type { CartItem } from '@/context/CartContext'
import type { CheckoutForm } from './checkout'
import { neonClient } from './neon-client'

export type StoredOrder = {
  id: string
  reference: string
  status: string
  payment_status: string
  email_status: string
  currency: string
  order_total: number
  created_at: string
}

export async function persistOrder({
  reference,
  currency,
  form,
  items,
}: {
  reference: string
  currency: string
  form: CheckoutForm
  items: CartItem[]
}) {
  const { data, error } = await neonClient.rpc('create_checkout_order', {
    p_reference: reference,
    p_currency: currency,
    p_customer: {
      name: form.fullName,
      email: form.email,
      phone: form.phone,
    },
    p_shipping_address: {
      addressLine1: form.address1,
      addressLine2: form.address2,
      city: form.city,
      region: form.state,
      postalCode: form.postalCode,
      country: form.country,
    },
    p_notes: form.notes,
    p_items: items.map(item => ({
      product_slug: item.slug,
      product_name: item.productName,
      brand: item.brand ?? '',
      pack_count: item.packCount,
      pack_label: item.packLabel ?? '',
      unit_price: item.price,
      quantity: item.qty,
      image_url: item.image ?? '',
    })),
  })

  if (error) throw new Error(error.message || 'The order could not be saved.')
  if (typeof data !== 'string') throw new Error('The order service returned an invalid response.')
  return data
}

export async function setOrderEmailStatus(orderId: string, status: 'sent' | 'failed') {
  const { error } = await neonClient.rpc('set_order_email_status', {
    p_order_id: orderId,
    p_status: status,
  })
  if (error) throw new Error(error.message || 'The order email status could not be updated.')
}

export async function listMyOrders(): Promise<StoredOrder[]> {
  const { data, error } = await neonClient
    .from('orders')
    .select('id,reference,status,payment_status,email_status,currency,order_total,created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message || 'Orders could not be loaded.')
  return (data ?? []) as StoredOrder[]
}
