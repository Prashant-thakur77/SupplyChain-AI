import { supabaseClient } from "@/lib/supabase/client";

const getUserData = async () => {
  try {
    const { data } = await supabaseClient.auth.getSession()
    
    if (!data?.session?.user?.id) {
      return null
    }

    const authUser = data.session.user

    const userdetails = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', authUser.id)

    if (userdetails?.data && userdetails.data.length > 0) {
      return userdetails.data[0]
    }

    // No row in users table yet — create one so foreign keys don't fail!
    console.log("No user data found in 'users' table, creating record now.")
    
    try {
      const { data: newUserData, error: insertError } = await supabaseClient
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email ?? 'unknown@example.com',
        })
        .select()
        .single();
        
      if (!insertError && newUserData) {
        return newUserData;
      } else {
        console.error("Failed to insert new user:", insertError);
      }
    } catch (insertErr) {
      console.error("Exception while inserting new user:", insertErr);
    }

    return {
      id: authUser.id,
      email: authUser.email ?? null,
      organisation_name: null,
      location: null,
      employee_count: null,
      industry: null,
      sub_industry: null,
      description: null,
    }
  } catch (err) {
    console.log("Error occurred while fetching user data:", err)
    return null
  }
}

export { getUserData }

const updateUserData = async (data: any) => {
  try {
    const { error } = await supabaseClient
      .from('users')
      .update({
        organisation_name: data.organisation_name,
        location: data.location,
        employee_count: data.employee_count,
        industry: data.industry,
        sub_industry: data.industry,
        description: data.description
      })
      .eq('id', data.id);
    if (error) {
      throw error;
    }
    return;
  } catch (error) {
    console.log('error is ', error);
    throw error;
  }
};

export { updateUserData };