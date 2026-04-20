import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { usuario_id, email, nombre } = req.body

  if (!usuario_id) return res.status(400).json({ error: 'Usuario requerido' })

  const supabase = createClient(
    process.env.SUPABASE_URL || 'https://cofrhfbkmmisxmsyqccq.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
  )

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'desconocida'
  const userAgent = req.headers['user-agent'] || 'desconocido'

  const { error } = await supabase
    .from('perfiles')
    .upsert({
      id: usuario_id,
      email: email || '',
      nombre: nombre || '',
      terminos_aceptados: true,
      terminos_fecha: new Date().toISOString(),
      terminos_version: '1.0',
      terminos_ip: ip,
      terminos_user_agent: userAgent
    }, { onConflict: 'id' })

  if (error) {
    console.error('Error al guardar términos:', error)
    return res.status(500).json({ error: 'Error al registrar aceptación.' })
  }

  return res.status(200).json({ ok: true })
}