'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type ActionState = { error: string } | null;

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        role: 'Customer',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function forgotPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(formData.get('email') as string, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'}/auth/confirm?next=/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: '' }; // empty string signals success
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }
}

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = formData.get('password') as string;
  const confirm = formData.get('confirmPassword') as string;

  if (password !== confirm) {
    return { error: 'Passwords do not match' };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/', 'layout');
    redirect('/');
  } catch (e) {
    // redirect() throws a special error — re-throw it
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e;
    return { error: 'Something went wrong. Please try again.' };
  }
}
