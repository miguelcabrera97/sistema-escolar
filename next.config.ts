import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Genera .next/standalone con server.js mínimo para la imagen Docker (Coolify)
  output: 'standalone',
}

export default nextConfig
