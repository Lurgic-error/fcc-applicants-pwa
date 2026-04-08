export function useQrCode() {
  function generateVerificationUrl(certificateId) {
    const baseUrl = window.location.origin
    return `${baseUrl}/verify/${encodeURIComponent(certificateId)}`
  }

  function generateQrDataUrl(text) {
    const size = 200
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="white"/>
      <rect x="10" y="10" width="60" height="60" rx="4" fill="none" stroke="#0f4c81" stroke-width="6"/>
      <rect x="22" y="22" width="36" height="36" rx="2" fill="#0f4c81"/>
      <rect x="${size - 70}" y="10" width="60" height="60" rx="4" fill="none" stroke="#0f4c81" stroke-width="6"/>
      <rect x="${size - 58}" y="22" width="36" height="36" rx="2" fill="#0f4c81"/>
      <rect x="10" y="${size - 70}" width="60" height="60" rx="4" fill="none" stroke="#0f4c81" stroke-width="6"/>
      <rect x="22" y="${size - 58}" width="36" height="36" rx="2" fill="#0f4c81"/>
      <text x="${size / 2}" y="${size / 2 + 5}" text-anchor="middle" font-size="10" font-family="monospace" fill="#0f4c81">SCAN TO VERIFY</text>
      <text x="${size / 2}" y="${size / 2 + 20}" text-anchor="middle" font-size="8" font-family="monospace" fill="#64748b">${text.slice(0, 20)}</text>
    </svg>`
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  return { generateVerificationUrl, generateQrDataUrl }
}
