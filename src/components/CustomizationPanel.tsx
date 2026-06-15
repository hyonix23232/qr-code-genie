import { Text, BlockStack, InlineStack, Select, Badge } from '@shopify/polaris'
import LogoUploader from './LogoUploader'

type DotType = 'square' | 'dots' | 'rounded' | 'extra-rounded'
type CornerType = 'square' | 'dot' | 'extra-rounded'

interface Props {
  fgColor: string
  bgColor: string
  dotStyle: DotType
  cornerStyle: CornerType
  onFgColorChange: (c: string) => void
  onBgColorChange: (c: string) => void
  onDotStyleChange: (s: DotType) => void
  onCornerStyleChange: (s: CornerType) => void
  onLogoUpload: (file: File) => void
  logoFile: File | null
  isPro: boolean
}

const colorPresets = [
  { label: 'Midnight', fg: '#000000', bg: '#ffffff' },
  { label: 'Ocean', fg: '#1e3a5f', bg: '#e8f0fe' },
  { label: 'Forest', fg: '#2d6a4f', bg: '#d8f3dc' },
  { label: 'Sunset', fg: '#d62828', bg: '#fef0ef' },
  { label: 'Royal', fg: '#6c1d8a', bg: '#f3e8ff' },
  { label: 'Minimal', fg: '#333333', bg: '#f5f5f5' },
]

const freeDotStyles = ['rounded']
const proDotStyles = ['square', 'dots', 'extra-rounded']
const freeCornerStyles = ['square']
const proCornerStyles = ['dot', 'extra-rounded']

const dotStyleOptions = [
  { label: 'Square', value: 'square' },
  { label: 'Rounded', value: 'rounded' },
  { label: 'Dots', value: 'dots' },
  { label: 'Extra Rounded', value: 'extra-rounded' },
]

const cornerStyleOptions = [
  { label: 'Square', value: 'square' },
  { label: 'Dot', value: 'dot' },
  { label: 'Extra Rounded', value: 'extra-rounded' },
]

export default function CustomizationPanel({
  fgColor, bgColor, dotStyle, cornerStyle,
  onFgColorChange, onBgColorChange, onDotStyleChange, onCornerStyleChange,
  onLogoUpload, logoFile, isPro,
}: Props) {
  const handleDotStyleChange = (v: string) => {
    if (!isPro && !freeDotStyles.includes(v)) return
    onDotStyleChange(v as DotType)
  }

  const handleCornerStyleChange = (v: string) => {
    if (!isPro && !freeCornerStyles.includes(v)) return
    onCornerStyleChange(v as CornerType)
  }

  return (
    <BlockStack gap="400">
      <InlineStack align="space-between" blockAlign="center">
        <Text as="h2" variant="headingMd">
          Customize
        </Text>
        {!isPro && <Badge tone="info">Free</Badge>}
      </InlineStack>

      <BlockStack gap="200">
        <Text as="h3" variant="headingSm" tone="subdued">
          Color Presets
        </Text>
        <div className="flex flex-wrap gap-2">
          {colorPresets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => { onFgColorChange(p.fg); onBgColorChange(p.bg) }}
              title={p.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium hover:border-gray-400 transition-colors cursor-pointer"
              style={{
                borderColor: fgColor === p.fg && bgColor === p.bg ? p.fg : undefined,
                backgroundColor: p.bg,
                color: p.fg,
              }}
            >
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: p.fg }}
              />
              {p.label}
            </button>
          ))}
        </div>
      </BlockStack>

      <BlockStack gap="200">
        <Text as="h3" variant="headingSm" tone="subdued">
          Colors
        </Text>
        <InlineStack gap="400" wrap={false}>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Foreground</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => onFgColorChange(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
              />
              <span className="text-xs text-gray-400 font-mono">{fgColor}</span>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => onBgColorChange(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
              />
              <span className="text-xs text-gray-400 font-mono">{bgColor}</span>
            </div>
          </div>
        </InlineStack>
      </BlockStack>

      <Select
        label="Dot Style"
        value={dotStyle}
        onChange={handleDotStyleChange}
        options={dotStyleOptions.map((opt) => ({
          ...opt,
          disabled: !isPro && proDotStyles.includes(opt.value),
        }))}
      />

      <Select
        label="Corner Style"
        value={cornerStyle}
        onChange={handleCornerStyleChange}
        options={cornerStyleOptions.map((opt) => ({
          ...opt,
          disabled: !isPro && proCornerStyles.includes(opt.value),
        }))}
      />

      <BlockStack gap="200">
        <Text as="h3" variant="headingSm" tone="subdued">
          Logo
        </Text>
        <LogoUploader onUpload={onLogoUpload} logoFile={logoFile} isPro={isPro} />
      </BlockStack>
    </BlockStack>
  )
}
