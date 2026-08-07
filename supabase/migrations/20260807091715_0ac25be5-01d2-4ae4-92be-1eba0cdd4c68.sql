INSERT INTO public.publishing_channels (key, label, enabled)
VALUES ('instagram_reel', 'Instagram Reels', true),
       ('facebook_reel', 'Facebook Reels', true)
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, enabled = true;