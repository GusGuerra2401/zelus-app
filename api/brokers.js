export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const { query, version } = req.query
  if (!query) return res.status(400).json({ error: 'Query requerida' })

  const mt = version || '4'

  try {
    const response = await fetch(
      `https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/known-mt-servers/${mt}/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'auth-token': process.env.METAAPI_TOKEN
        }
      }
    )
    const data = await response.json()
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: 'Error consultando MetaAPI' })
  }
}