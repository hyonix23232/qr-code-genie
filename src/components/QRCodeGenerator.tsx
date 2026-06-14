import { RefObject } from 'react'

interface Props {
  url: string
  onUrlChange: (url: string) => void
  qrContainerRef: RefObject<HTMLDivElement | null>
  onDownload: (extension: 'png' | 'svg') => void
  isPro: boolean
}

export default function QRCodeGenerator({
  url,
  onUrlChange,
  qrContainerRef,
  onDownload,
  isPro,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        URL or Text
      </label>
      <input
        type="text"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="https://example.com"
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
      />

      <div className="mt-6 flex flex-col items-center">
        <div
          ref={qrContainerRef}
          className="flex items-center justify-center w-[300px] h-[300px] bg-white rounded-xl border border-gray-100"
        />
        {!url && (
          <p className="text-xs text-gray-400 mt-2">Enter a URL above to generate</p>
        )}
      </div>

      <div className="mt-6 flex gap-2 justify-center">
        <button
          onClick={() => onDownload('png')}
          disabled={!url}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Download PNG
        </button>
        <button
          onClick={() => onDownload('svg')}
          disabled={!url || !isPro}
          title={!isPro ? 'Pro feature' : ''}
          className="px-5 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          SVG {!isPro && '(Pro)'}
        </button>
      </div>
    </div>
  )
}
