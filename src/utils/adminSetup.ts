
import { supabase } from '@/integrations/supabase/client';

export const ensureAdminProfile = async () => {  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('No authenticated user');
  }

  // Check if profile exists
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!existingProfile) {
    // Create profile with default 'user' role - admin must be set via DB
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        email: user.email,
        role: 'user'
      }])
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
        const { data: fetchedProfile, error: refetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (refetchError) throw refetchError;
        return fetchedProfile;
      }
      throw createError;
    }

    return newProfile;
  }

  return existingProfile;
};

