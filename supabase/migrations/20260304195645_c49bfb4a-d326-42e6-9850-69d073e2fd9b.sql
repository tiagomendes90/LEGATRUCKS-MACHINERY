
INSERT INTO public.profiles (id, email, role)
VALUES (
  'df7a97f3-71a9-417b-96a4-11063dc519db',
  'admin@lega.pt',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET role = 'admin';
