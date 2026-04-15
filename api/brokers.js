export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://zelus.penguinfxacademy.com')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const { query } = req.query
  if (!query) return res.status(400).json({ error: 'Query requerida' })

  try {
    const response = await fetch(
      `https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/servers/mt4?name=${encodeURIComponent(query)}`,
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