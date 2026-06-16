import { useState, useRef, useEffect, useCallback } from 'react'
import QRCodeStyling from 'qr-code-styling'
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineGrid,
  InlineStack,
  Frame,
  Toast,
  Button,
  Banner,
} from '@shopify/polaris'
import QRCodeGenerator from './components/QRCodeGenerator'
import CustomizationPanel from './components/CustomizationPanel'
import ShopifyIntegration from './components/ShopifyIntegration'
import AppLogo from './components/AppLogo'

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
  const [appHandle, setAppHandle] = useState('qr-code-genie')
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null)
  const qrRef = useRef<QRCodeStyling | null>(null)
  const qrContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!qrContainerRef.current) return
    qrContainerRef.current.innerHTML = ''
    const qr = new QRCodeStyling({
      width: 320,
      height: 320,
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
    qrRef.current?.update({
      image: logoDataUrl || null,
      imageOptions: { margin: 10 },
    })
  }, [logoDataUrl])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const host = params.get('host')
    const shopParam = params.get('shop')
    if (host) {
      setIsEmbedded(true)
    }
    if (shopParam) setShop(shopParam)
  }, [])

  useEffect(() => {
    if (!shop) return
    fetch(`/api/subscription?shop=${shop}`)
      .then((r) => r.json())
      .then((data) => setIsPro(data.active))
      .catch(() => {})
  }, [shop])

  useEffect(() => {
    if (!isPro) {
      if (dotStyle !== 'rounded') setDotStyle('rounded')
      if (cornerStyle !== 'square') setCornerStyle('square')
    }
  }, [isPro])

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => { if (data.appHandle) setAppHandle(data.appHandle) })
      .catch(() => {})
  }, [])

  const handleLogoUpload = useCallback((file: File | null) => {
    if (!file) {
      setLogoFile(null)
      setLogoDataUrl(null)
      qrRef.current?.update({ image: undefined })
      return
    }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setLogoDataUrl(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleDownload = useCallback(async (extension: 'png' | 'svg') => {
    if (!url) {
      setToast({ message: 'Enter a URL first', error: true })
      return
    }
    const canvas = qrContainerRef.current?.querySelector('canvas')
    if (!canvas) return
    if (extension === 'svg') {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><foreignObject width="320" height="320"><img src="${canvas.toDataURL()}"/></foreignObject></svg>`
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'qr-code.svg'
      a.click()
      URL.revokeObjectURL(a.href)
    } else {
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
    }
    setToast({ message: `QR code downloaded as ${extension.toUpperCase()}` })
  }, [url])

  const storeHandle = shop.replace('.myshopify.com', '')
  const pricingUrl = shop ? `https://admin.shopify.com/store/${storeHandle}/charges/${appHandle}/pricing_plans` : '#'

  const toastMarkup = toast ? (
    <Toast
      content={toast.message}
      error={toast.error}
      onDismiss={() => setToast(null)}
    />
  ) : null

  return (
    <Frame>
      <Page
        title={
          <InlineStack gap="200" blockAlign="center">
            <AppLogo size={36} />
            <span>QR Code Genie</span>
          </InlineStack>
        }
        subtitle="Generate beautiful QR codes in seconds"
      >
        <BlockStack gap="500">
          {isEmbedded && (
            <ShopifyIntegration
              shop={shop}
              onSelectProduct={(productUrl) => setUrl(productUrl)}
            />
          )}

          {!isPro && shop && (
            <Banner tone="info">
              <InlineStack gap="300" blockAlign="center" wrap={false}>
                <Text as="span" variant="bodyMd">
                  Upgrade to Pro to unlock custom styles, logo upload, and SVG export — just $5/month.
                </Text>
                <Button
                  variant="primary"
                  onClick={() => { window.top.location.href = pricingUrl }}
                >
                  Upgrade Now
                </Button>
              </InlineStack>
            </Banner>
          )}

          <InlineGrid columns={{ xs: 1, md: 2 }} gap="500">
            <Card>
              <QRCodeGenerator
                url={url}
                onUrlChange={setUrl}
                qrContainerRef={qrContainerRef}
                onDownload={handleDownload}
                isPro={isPro}
              />
            </Card>

            <Card>
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
            </Card>
          </InlineGrid>
        </BlockStack>
      </Page>
      {toastMarkup}
    </Frame>
  )
}
