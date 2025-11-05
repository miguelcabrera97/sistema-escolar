import { MercadoPagoConfig, Preference } from 'mercadopago'

// Configurar el cliente de Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
    idempotencyKey: 'your-unique-key'
  }
})

// Exportar el cliente configurado
export const mercadoPagoClient = client

// Exportar la clase Preference para crear preferencias de pago
export const mercadoPagoPreference = new Preference(client)
