import { useRef } from 'react'

interface Props {
  onUpload: (file: File) => void
  logoFile: File | null
  isPro: boolean
}

export default function LogoUploader({ onUpload, logoFile, isPro }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  if (!isPro) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
        <p className="text-xs text-gray-400">Upgrade to Pro to upload a logo</p>
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
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center hover:bg-gray-100 transition-colors cursor-pointer"
      >
        {logoFile ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs text-gray-600 truncate max-w-[140px]">{logoFile.name}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-400">Click to upload logo</span>
            <span className="text-xs text-gray-300">PNG, JPG, SVG</span>
          </div>
        )}
      </button>
    </div>
  )
}
