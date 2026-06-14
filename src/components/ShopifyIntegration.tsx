import { useState, useEffect } from 'react'

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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchProducts() {
      if (!shop) return
      setLoading(true)
      try {
        const res = await fetch(`/api/products?shop=${shop}&limit=5`)
        const data = await res.json()
        setProducts(data.products || [])
      } catch {
        console.warn('Could not fetch products')
      } finally {
        setLoading(false)
      }
    }
    if (shop) fetchProducts()
  }, [shop])

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center gap-4 text-sm">
        <span className="font-medium text-gray-700 whitespace-nowrap">QR Code Genie</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500 text-xs truncate">{shop}</span>

        {loading ? (
          <span className="text-xs text-gray-400 ml-auto">Loading products...</span>
        ) : products.length > 0 ? (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-400">Quick pick:</span>
            <select
              onChange={(e) => {
                if (e.target.value) onSelectProduct(`https://${shop.replace('https://', '')}/products/${e.target.value}`)
              }}
              className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600"
            >
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.handle}>{p.title}</option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
    </div>
  )
}
