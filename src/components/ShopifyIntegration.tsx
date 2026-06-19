import { useState, useEffect } from 'react'
import { Text, InlineStack, Select } from '@shopify/polaris'

interface Props {
  shop: string
  onSelectProduct: (url: string) => void
}

interface Product {
  id: number
  title: string
  handle: string
}

export default function ShopifyIntegration({ shop, onSelectProduct }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [primaryDomain, setPrimaryDomain] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchProducts() {
      if (!shop) return
      setLoading(true)
      try {
        const headers: Record<string, string> = {}
        const shopify = (window as any).shopify
        if (shopify?.idToken) {
          const token = await shopify.idToken()
          headers['Authorization'] = `Bearer ${token}`
        }
        const res = await fetch(`/api/products?shop=${shop}&limit=50`, { headers })
        const data = await res.json()
        setProducts(data.products || [])
        setPrimaryDomain(data.primaryDomain || `https://${shop}`)
      } catch {

      } finally {
        setLoading(false)
      }
    }
    if (shop) fetchProducts()
  }, [shop])

  const baseUrl = primaryDomain || `https://${shop}`
  const productOptions = [
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

          <div className="w-64">
            <Select
              label="Quick pick a product"
              labelHidden
              value=""
              onChange={(v) => {
                if (v) onSelectProduct(`${baseUrl}/products/${v}`)
              }}
              options={loading ? [] : productOptions}
              placeholder={loading ? 'Loading products...' : 'Quick pick a product...'}
            />
          </div>
      </InlineStack>
    </div>
  )
}