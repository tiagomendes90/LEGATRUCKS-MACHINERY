
import { supabase } from '@/integrations/supabase/client';

export const ensureAdminProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  // Check if profile exists
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
    throw fetchError;
  }

  if (!profile) {
    // Create profile if it doesn't exist
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        email: user.email,
        role: 'admin'
      }])
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return newProfile;
  }

  // Update to admin if not already
  if (profile.role !== 'admin') {
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updatedProfile;
  }

  return profile;
};
