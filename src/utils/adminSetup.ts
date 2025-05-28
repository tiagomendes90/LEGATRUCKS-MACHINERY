
import { supabase } from '@/integrations/supabase/client';

export const ensureAdminProfile = async () => {
  console.log('Setting up admin profile...');
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('No authenticated user:', userError);
    throw new Error('No authenticated user');
  }

  console.log('User:', user.email, 'ID:', user.id);

  // First, try to get existing profile
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching profile:', fetchError);
    throw fetchError;
  }

  console.log('Existing profile:', existingProfile);

  if (!existingProfile) {
    console.log('Creating new admin profile...');
    // Create new profile
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

    console.log('Admin profile created successfully:', newProfile);
    return newProfile;
  }

  // Update existing profile to admin if not already
  if (existingProfile.role !== 'admin') {
    console.log('Updating user role to admin...');
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

    console.log('User role updated to admin successfully:', updatedProfile);
    return updatedProfile;
  }

  console.log('User already has admin role');
  return existingProfile;
};

// Force create admin profile function
export const forceCreateAdminProfile = async () => {
  console.log('Force creating admin profile...');
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  // Delete existing profile if any
  await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id);

  // Create new admin profile
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
    console.error('Error force creating profile:', createError);
    throw createError;
  }

  console.log('Admin profile force created successfully:', newProfile);
  return newProfile;
};
