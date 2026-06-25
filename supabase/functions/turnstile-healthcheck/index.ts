import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  const configured = typeof secret === 'string' && secret.length > 0;

  const body = {
    ok: true,
    secretConfigured: configured,
    secretLength: configured ? secret!.length : 0,
    prefix: configured ? secret!.slice(0, 4) : null,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});