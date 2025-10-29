// lib/convert-to-webp-base64.ts
export async function fileToWebpBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = function (e) {
        const img = new window.Image()
        img.onload = function () {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0)
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('No se pudo convertir a WebP'))
              const reader2 = new FileReader()
              reader2.onloadend = function () {
                resolve(reader2.result as string)
              }
              reader2.readAsDataURL(blob)
            },
            'image/webp',
            0.8 // calidad
          )
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  