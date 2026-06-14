import { useState, useRef, useEffect, useCallback } from 'react'
import QRCodeStyling from 'qr-code-styling'
import QRCodeGenerator from './components/QRCodeGenerator'
import CustomizationPanel from './components/CustomizationPanel'
import ShopifyIntegration from './components/ShopifyIntegration'

type DotType = 'square' | 'dots' | 'rounded' | 'extra-rounded'
type CornerType = 'square' | 'dot' | 'extra-rounded'

export default function App() {
  const [url, setUrl] = useState('')
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [dotStyle, setDotStyle] = useState<DotType>('rounded')
  const [cornerStyle, setCornerStyle] = useState<CornerType>('square')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [isEmbedded, setIsEmbedded] = useState(false)
  const [shop, setShop] = useState('')
  const [billingLoading, setBillingLoading] = useState(false)

  const qrRef = useRef<QRCodeStyling | null>(null)
  const qrContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!qrContainerRef.current) return
    qrContainerRef.current.innerHTML = ''
    const qr = new QRCodeStyling({
      width: 280,
      height: 280,
      data: url || 'https://',
      dotsOptions: { color: fgColor, type: dotStyle },
      cornersSquareOptions: { color: fgColor, type: cornerStyle },
      cornersDotOptions: { color: fgColor, type: 'dot' },
      backgroundOptions: { color: bgColor },
    })
    qr.append(qrContainerRef.current)
    qrRef.current = qr
    return () => { qrRef.current = null }
  }, [])

  useEffect(() => {
    qrRef.current?.update({
      data: url || 'https://',
      dotsOptions: { color: fgColor, type: dotStyle },
      cornersSquareOptions: { color: fgColor, type: cornerStyle },
      backgroundOptions: { color: bgColor },
    })
  }, [url, fgColor, bgColor, dotStyle, cornerStyle])

  useEffect(() => {
    if (logoDataUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        qrRef.current?.update({
          image: img,
          imageOptions: { crossOrigin: 'anonymous', margin: 10 },
        })
      }
      img.src = logoDataUrl
    }
  }, [logoDataUrl])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const host = params.get('host')
    const shopParam = params.get('shop')
    if (host) setIsEmbedded(true)
    if (shopParam) setShop(shopParam)
  }, [])

  useEffect(() => {
    async function checkBilling() {
      if (!shop) return
      try {
        const res = await fetch(`/api/billing/check?shop=${shop}`)
        const data = await res.json()
        if (data.active) setIsPro(true)
      } catch {}
    }
    checkBilling()
  }, [shop])

  const handleLogoUpload = useCallback((file: File) => {
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setLogoDataUrl(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleDownload = useCallback(async (extension: 'png' | 'svg') => {
    if (!url) return
    const canvas = qrContainerRef.current?.querySelector('canvas')
    if (!canvas) return
    if (extension === 'svg') {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280"><foreignObject width="280" height="280"><img src="${canvas.toDataURL()}"/></foreignObject></svg>`
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'qr-code.svg'
      a.click()
      URL.revokeObjectURL(a.href)
      return
    }
    canvas.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'qr-code.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    }, 'image/png')
  }, [url, fgColor, bgColor, dotStyle, cornerStyle, logoDataUrl, isPro])

  const handleUpgrade = useCallback(async () => {
    if (!shop) return
    setBillingLoading(true)
    try {
      const res = await fetch(`/api/billing/create?shop=${shop}`)
      const data = await res.json()
      if (data.confirmationUrl) {
        window.top.location.href = data.confirmationUrl
      } else {
        alert('Could not create billing. Check console for details.')
        console.error('Billing response:', data)
      }
    } catch (err) {
      console.error('Billing error:', err)
      alert('Upgrade failed. Check console for details.')
    } finally {
      setBillingLoading(false)
    }
  }, [shop])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {isEmbedded && (
        <ShopifyIntegration
          shop={shop}
          onSelectProduct={(productUrl) => setUrl(productUrl)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {!isEmbedded && (
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">QR Code Genie</h1>
            <p className="text-gray-500 mt-1">Generate beautiful QR codes in seconds</p>
          </header>
        )}

        {!isPro && shop && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl text-center">
            <p className="text-sm text-purple-700">
              Upgrade to <strong>Pro</strong> &mdash; unlock logo upload, custom styles, and high-res downloads for just <strong>$5/month</strong>
            </p>
            <button
              onClick={handleUpgrade}
              disabled={billingLoading}
              className="mt-2 px-5 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {billingLoading ? 'Loading...' : 'Upgrade Now'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <QRCodeGenerator
              url={url}
              onUrlChange={setUrl}
              qrContainerRef={qrContainerRef}
              onDownload={handleDownload}
              isPro={isPro}
            />
          </div>
          <div className="lg:col-span-2">
            <CustomizationPanel
              fgColor={fgColor}
              bgColor={bgColor}
              dotStyle={dotStyle}
              cornerStyle={cornerStyle}
              onFgColorChange={setFgColor}
              onBgColorChange={setBgColor}
              onDotStyleChange={setDotStyle}
              onCornerStyleChange={setCornerStyle}
              onLogoUpload={handleLogoUpload}
              logoFile={logoFile}
              isPro={isPro}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
