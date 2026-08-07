INSERT INTO public.publishing_channels (key, label, enabled, config)
VALUES
  ('instagram_story', 'Instagram Stories', true, '{}'::jsonb),
  ('facebook_story', 'Facebook Stories', true, '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;