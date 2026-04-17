import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { apodo, plataforma, broker, servidor, login, password, usuario_id } = req.body

  if (!apodo || !plataforma || !broker || !servidor || !login || !password || !usuario_id) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' })
  }

  // 1. Validar credenciales con MetaApi
  try {
    const metaApiToken = process.env.METAAPI_TOKEN

    // Crear cuenta en MetaApi para validar
    const crearRes = await fetch('https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': metaApiToken
      },
      body: JSON.stringify({
        name: apodo,
        type: 'cloud',
        login: login,
        password: password,
        server: servidor,
        platform: plataforma.toLowerCase(),
        magic: 0
      })
    })

    const crearData = await crearRes.json()

    if (!crearRes.ok) {
      return res.status(400).json({ error: 'Credenciales inválidas. Verifica tus datos e intenta de nuevo.' })
    }

    const accountId = crearData.id

    // Esperar a que la cuenta se conecte (máx 30 segundos)
    let conectada = false
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 3000))
      const estadoRes = await fetch(`https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}`, {
        headers: { 'auth-token': metaApiToken }
      })
      const estadoData = await estadoRes.json()
      if (estadoData.connectionStatus === 'CONNECTED') {
        conectada = true
        break
      }
      if (estadoData.connectionStatus === 'ERROR') break
    }

    // Eliminar la cuenta de MetaApi (solo validamos, no mantenemos)
    await fetch(`https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}`, {
      method: 'DELETE',
      headers: { 'auth-token': metaApiToken }
    })

    if (!conectada) {
      return res.status(400).json({ error: 'No se pudo verificar la cuenta. Revisa que el servidor y las credenciales sean correctos.' })
    }

    // 2. Guardar en Supabase solo si las credenciales son válidas
    const supabase = createClient(
      process.env.SUPABASE_URL || 'https://cofrhfbkmmisxmsyqccq.supabase.co',
      process.env.SUPABASE_SERVICE_KEY
    )

    const { error: dbError } = await supabase
      .from('cuentas')
      .insert({
        usuario_id,
        apodo,
        plataforma,
        broker,
        servidor,
        login
        // No guardamos el password por seguridad
      })

    if (dbError) {
      console.error('Error Supabase:', dbError)
      return res.status(500).json({ error: 'Cuenta verificada pero hubo un error al guardar. Contacta soporte.' })
    }

    return res.status(200).json({ ok: true, mensaje: 'Cuenta conectada exitosamente.' })

  } catch (err) {
    console.error('Error general:', err)
    return res.status(500).json({ error: 'Error interno. Intenta de nuevo.' })
  }
}