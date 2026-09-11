-- Persiste o boas-vindas por conta, independentemente do dispositivo usado.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Mantém o histórico de quem já concluiu pelo metadata do Auth.
UPDATE public.profiles AS profile
SET onboarding_completed = TRUE
FROM auth.users AS auth_user
WHERE profile.id = auth_user.id
  AND LOWER(COALESCE(auth_user.raw_user_meta_data ->> 'onboarding_completed', 'false')) = 'true';

NOTIFY pgrst, 'reload schema';
