import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

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

// Exportar la clase Preference para crear preferencias de pago (Checkout Pro)
export const mercadoPagoPreference = new Preference(client)

// Exportar la clase Payment para la API de Orders (Checkout API)
export const mercadoPagoPayment = new Payment(client)
