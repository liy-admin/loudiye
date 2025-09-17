export async function onRequest(context) {
  const { env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    if (!env.WHATSAPP_LINKS) {
      return new Response(JSON.stringify({enabled: false}), { headers });
    }

    const enabled = await env.WHATSAPP_LINKS.get('GA_ENABLED') === 'true';
    const trackingId = await env.WHATSAPP_LINKS.get('GA_TRACKING_ID');

    return new Response(JSON.stringify({
      enabled: enabled && trackingId,
      trackingId: trackingId || null
    }), { headers });

  } catch (error) {
    return new Response(JSON.stringify({enabled: false}), { headers });
  }
}