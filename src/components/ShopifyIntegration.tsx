import { useState, useEffect } from 'react'
import { Text, InlineStack, Select } from '@shopify/polaris'
import { getSessionToken } from '@shopify/app-bridge/utilities/session-token'

interface Props {
  shop: string
  appBridge: any
  onSelectProduct: (url: string) => void
}

interface Product {
  id: number
  title: string
  handle: string
}

export default function ShopifyIntegration({ shop, appBridge, onSelectProduct }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchProducts() {
      if (!shop) return
      setLoading(true)
      try {
        const headers: Record<string, string> = {}
        if (appBridge) {
          const token = await getSessionToken(appBridge)
          headers['Authorization'] = `Bearer ${token}`
        }
        const res = await fetch(`/api/products?shop=${shop}&limit=50`, { headers })
        const data = await res.json()
        setProducts(data.products || [])
      } catch {
        console.warn('Could not fetch products')
      } finally {
        setLoading(false)
      }
    }
    if (shop) fetchProducts()
  }, [shop, appBridge])

  const productOptions = [
    { label: loading ? 'Loading...' : 'Select a product...', value: '' },
    ...products.map((p) => ({ label: p.title, value: p.handle })),
  ]

  return (
    <div className="px-4 py-3 bg-white border-b border-gray-200 rounded-t-lg">
      <InlineStack align="space-between" blockAlign="center" gap="200">
        <InlineStack gap="200" blockAlign="center">
          <Text as="span" variant="headingSm" fontWeight="semibold">
            QR Code Genie
          </Text>
          <Text as="span" variant="bodySm" tone="subdued">
            |
          </Text>
          <Text as="span" variant="bodyXs" tone="subdued">
            {shop}
          </Text>
        </InlineStack>

        {!loading && products.length > 0 && (
          <div className="w-64">
            <Select
              label="Quick pick a product"
              labelHidden
              value=""
              onChange={(v) => {
                if (v) onSelectProduct(`https://${shop.replace('https://', '')}/products/${v}`)
              }}
              options={productOptions}
              placeholder="Quick pick a product..."
            />
          </div>
        )}
      </InlineStack>
    </div>
  )
}