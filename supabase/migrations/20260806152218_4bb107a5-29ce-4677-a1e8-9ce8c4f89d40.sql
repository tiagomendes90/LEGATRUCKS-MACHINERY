UPDATE public.meta_connections
SET is_active = false,
    status = 'replaced',
    page_access_token = NULL,
    user_access_token = NULL,
    last_error = 'Ligação desativada: migração para a nova Meta App (Business).'
WHERE is_active = true;