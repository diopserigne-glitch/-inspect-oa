// =============================================================================
//  Proxy serverless InspectOA — Cloudflare Worker
//  Garde la clé API Anthropic côté serveur. L'app navigateur POST ici un corps
//  de requête Messages API ; le worker l'augmente de la clé et le relaie.
//
//  Déploiement :
//    npm i -g wrangler
//    cd worker && wrangler deploy
//    wrangler secret put ANTHROPIC_API_KEY      # colle ta clé sk-ant-...
//    # (optionnel) wrangler secret put APP_TOKEN  # jeton partagé app<->worker
//  Puis renseigne l'URL du worker dans « Réglages IA » de l'application.
// =============================================================================

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODELES_AUTORISES = ['claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-8']

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-app-token',
      'Access-Control-Max-Age': '86400',
    }
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
    if (request.method !== 'POST') return j({ error: 'method_not_allowed' }, 405, cors)

    // Jeton partagé optionnel (limite l'usage du proxy à votre app)
    if (env.APP_TOKEN && request.headers.get('x-app-token') !== env.APP_TOKEN) {
      return j({ error: 'unauthorized' }, 401, cors)
    }

    let body
    try {
      body = await request.json()
    } catch {
      return j({ error: 'invalid_json' }, 400, cors)
    }

    // Garde-fous : modèle sur liste blanche, nombre d'images borné.
    if (!MODELES_AUTORISES.includes(body.model)) {
      return j({ error: 'model_not_allowed', allowed: MODELES_AUTORISES }, 400, cors)
    }
    const nbImages = JSON.stringify(body.messages || []).match(/"type":"image"/g)?.length || 0
    if (nbImages > 8) return j({ error: 'too_many_images' }, 413, cors)

    if (!env.ANTHROPIC_API_KEY) return j({ error: 'missing_api_key_secret' }, 500, cors)

    const upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    const text = await upstream.text()
    return new Response(text, {
      status: upstream.status,
      headers: { ...cors, 'content-type': 'application/json' },
    })
  },
}

function j(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  })
}
