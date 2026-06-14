import { useRef, useState } from 'react'
import { Text, Icon } from '@shopify/polaris'
import { ImageIcon, XCircleIcon } from '@shopify/polaris-icons'

interface Props {
  onUpload: (file: File) => void
  logoFile: File | null
  isPro: boolean
}

export default function LogoUploader({ onUpload, logoFile, isPro }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && ['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
      onUpload(file)
    }
  }

  if (!isPro) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
        <Text as="p" variant="bodySm" tone="subdued">
          Upgrade to Pro to upload a logo
        </Text>
      </div>
    )
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
        }}
        className="hidden"
      />

      {logoFile ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="w-10 h-10 rounded-lg bg-white border border-green-200 flex items-center justify-center overflow-hidden">
            <img
              src={URL.createObjectURL(logoFile)}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <Text as="p" variant="bodySm" fontWeight="semibold">
              {logoFile.name}
            </Text>
            <Text as="p" variant="bodyXs" tone="subdued">
              {(logoFile.size / 1024).toFixed(1)} KB
            </Text>
          </div>
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = ''
              onUpload(new File([], ''))

            }}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <Icon source={XCircleIcon} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`w-full p-5 rounded-lg border-2 border-dashed text-center transition-all cursor-pointer ${
            dragging
              ? 'border-purple-400 bg-purple-50'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <Icon source={ImageIcon} tone="base" />
            <Text as="p" variant="bodySm" tone="subdued">
              Click to upload logo
            </Text>
            <Text as="p" variant="bodyXs" tone="subdued">
              PNG, JPG or SVG
            </Text>
          </div>
        </button>
      )}
    </div>
  )
}
