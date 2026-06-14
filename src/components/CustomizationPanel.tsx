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

const dotStyles: { value: DotType; label: string; pro: boolean }[] = [
  { value: 'square', label: 'Square', pro: false },
  { value: 'dots', label: 'Dots', pro: true },
  { value: 'rounded', label: 'Rounded', pro: false },
  { value: 'extra-rounded', label: 'Extra Rounded', pro: true },
]

const cornerStyles: { value: CornerType; label: string; pro: boolean }[] = [
  { value: 'square', label: 'Square', pro: false },
  { value: 'dot', label: 'Dot', pro: true },
  { value: 'extra-rounded', label: 'Rounded', pro: true },
]

export default function CustomizationPanel({
  fgColor, bgColor, dotStyle, cornerStyle,
  onFgColorChange, onBgColorChange, onDotStyleChange, onCornerStyleChange,
  onLogoUpload, logoFile, isPro,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Customize</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Foreground Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={fgColor}
              onChange={(e) => onFgColorChange(e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
            />
            <span className="text-xs text-gray-500 font-mono">{fgColor}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1.5">Background Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => onBgColorChange(e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
            />
            <span className="text-xs text-gray-500 font-mono">{bgColor}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1.5">
          Dot Style
          {!isPro && dotStyle !== 'square' && dotStyle !== 'rounded' && (
            <span className="text-purple-500 text-xs ml-1">(Pro)</span>
          )}
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {dotStyles.map((s) => (
            <button
              key={s.value}
              onClick={() => { if (isPro || !s.pro) onDotStyleChange(s.value) }}
              disabled={!isPro && s.pro}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                dotStyle === s.value
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              } ${!isPro && s.pro ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {s.label}
              {!isPro && s.pro && ' 🔒'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1.5">
          Corner Style
          {!isPro && (
            <span className="text-purple-500 text-xs ml-1">(Pro)</span>
          )}
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {cornerStyles.map((s) => (
            <button
              key={s.value}
              onClick={() => { if (isPro || !s.pro) onCornerStyleChange(s.value) }}
              disabled={!isPro && s.pro}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                cornerStyle === s.value
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              } ${!isPro && s.pro ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {s.label}
              {!isPro && s.pro && ' 🔒'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1.5">
          Logo
          {!isPro && <span className="text-purple-500 text-xs ml-1">(Pro)</span>}
        </label>
        <LogoUploader onUpload={onLogoUpload} logoFile={logoFile} isPro={isPro} />
      </div>
    </div>
  )
}
