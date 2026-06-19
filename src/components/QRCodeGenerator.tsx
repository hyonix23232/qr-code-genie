import { RefObject } from 'react'
import { TextField, Button, ButtonGroup, Text, BlockStack, InlineStack } from '@shopify/polaris'

interface Props {
  url: string
  onUrlChange: (url: string) => void
  qrContainerRef: RefObject<HTMLDivElement | null>
  onDownload: (extension: 'png' | 'svg') => void
  isPro: boolean | null
}

export default function QRCodeGenerator({
  url,
  onUrlChange,
  qrContainerRef,
  onDownload,
  isPro,
}: Props) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        QR Code
      </Text>

      <TextField
        label="URL or Text"
        value={url}
        onChange={onUrlChange}
        placeholder="https://example.com"
        autoComplete="off"
        clearButton
        onClearButtonClick={() => onUrlChange('')}
      />

      <BlockStack align="center" gap="300">
        <div
          ref={qrContainerRef}
          className="flex items-center justify-center w-[340px] h-[340px] bg-white rounded-xl border border-gray-100 shadow-sm"
        />
        {!url && (
          <Text as="p" variant="bodySm" tone="subdued">
            Enter a URL above to generate
          </Text>
        )}
      </BlockStack>

      <ButtonGroup fullWidth>
        <Button
          onClick={() => onDownload('png')}
          disabled={!url}
          variant="primary"
        >
          Download PNG
        </Button>
        <Button
          onClick={() => onDownload('svg')}
          disabled={!url || isPro !== true}
        >
          {isPro === true ? 'Download SVG' : 'SVG (Pro)'}
        </Button>
      </ButtonGroup>
    </BlockStack>
  )
}
