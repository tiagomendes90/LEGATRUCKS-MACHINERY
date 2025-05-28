
import { supabase } from '@/integrations/supabase/client';

export const ensureAdminProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  console.log('Checking admin profile for user:', user.email);

  // Check if profile exists
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error('Error fetching profile:', fetchError);
    throw fetchError;
  }

  if (!profile) {
    console.log('Creating new admin profile for user:', user.email);
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
      console.error('Error creating profile:', createError);
      throw createError;
    }

    console.log('Admin profile created successfully');
    return newProfile;
  }

  // Update to admin if not already
  if (profile.role !== 'admin') {
    console.log('Updating user role to admin');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile to admin:', updateError);
      throw updateError;
    }

    console.log('User role updated to admin successfully');
    return updatedProfile;
  }

  console.log('User already has admin role');
  return profile;
};
