
import { supabase } from '@/integrations/supabase/client';

export const ensureAdminProfile = async () => {
  console.log('=== STARTING ADMIN PROFILE SETUP ===');
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  console.log('✓ Checking admin profile for user:', user.email);
  console.log('✓ User ID:', user.id);

  // Check if profile exists
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error('❌ Error fetching profile:', fetchError);
    throw fetchError;
  }

  if (!profile) {
    console.log('⚠️ Creating new admin profile for user:', user.email);
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
      console.error('❌ Error creating profile:', createError);
      throw createError;
    }

    console.log('✓ Admin profile created successfully:', newProfile);
    
    // Test the is_admin function after creating profile
    console.log('Testing is_admin function after profile creation...');
    const { data: isAdminTest, error: adminTestError } = await supabase.rpc('is_admin');
    console.log('is_admin function result:', isAdminTest);
    if (adminTestError) {
      console.error('❌ Error testing is_admin function:', adminTestError);
    }
    
    console.log('=== ADMIN PROFILE SETUP COMPLETED ===');
    return newProfile;
  }

  // Update to admin if not already
  if (profile.role !== 'admin') {
    console.log('⚠️ Updating user role to admin for:', user.email);
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating profile to admin:', updateError);
      throw updateError;
    }

    console.log('✓ User role updated to admin successfully:', updatedProfile);
    
    // Test the is_admin function after updating profile
    console.log('Testing is_admin function after role update...');
    const { data: isAdminTest, error: adminTestError } = await supabase.rpc('is_admin');
    console.log('is_admin function result:', isAdminTest);
    if (adminTestError) {
      console.error('❌ Error testing is_admin function:', adminTestError);
    }
    
    console.log('=== ADMIN PROFILE SETUP COMPLETED ===');
    return updatedProfile;
  }

  console.log('✓ User already has admin role:', profile);
  
  // Test the is_admin function
  console.log('Testing is_admin function...');
  const { data: isAdminTest, error: adminTestError } = await supabase.rpc('is_admin');
  console.log('is_admin function result:', isAdminTest);
  if (adminTestError) {
    console.error('❌ Error testing is_admin function:', adminTestError);
  }
  
  console.log('=== ADMIN PROFILE SETUP COMPLETED ===');
  return profile;
};
