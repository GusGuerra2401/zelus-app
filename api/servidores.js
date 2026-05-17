const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnPPvjucxUc1_Px-VLBTIJbk0SeeFc0fE-iSHn6JH3zfH21x-Nw-Y2lRWIDeA4j7ogIa7auqcAMXIQ/pub?gid=0&single=true&output=csv'

let cache = null
let cacheTime = null
const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 horas en ms

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Devolver caché si es reciente
  if (cache && cacheTime && (Date.now() - cacheTime) < CACHE_DURATION) {
    return res.status(200).json(cache)
  }

  try {
    const response = await fetch(SHEET_CSV_URL)
    if (!response.ok) throw new Error('Error al leer el Sheet')

    const text = await response.text()
    const lines = text.trim().split('\n')

    // Saltar la fila de encabezados (fila 1)
    const servidores = lines.slice(1)
      .map(line => {
        const cols = line.split(',')
        return {
          broker: cols[0]?.trim().replace(/"/g, ''),
          servidor: cols[1]?.trim().replace(/"/g, ''),
          plataforma: cols[2]?.trim().replace(/"/g, ''),
          activo: cols[3]?.trim().replace(/"/g, '')
        }
      })
      .filter(s => s.activo === 'TRUE' && s.servidor)

    cache = servidores
    cacheTime = Date.now()

    return res.status(200).json(servidores)

  } catch (error) {
    console.error('Error leyendo servidores:', error)

    // Si hay caché aunque sea vieja, úsala
    if (cache) return res.status(200).json(cache)

    return res.status(500).json({ error: 'No se pudieron cargar los servidores.' })
  }
}
