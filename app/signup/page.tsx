'use client';

import { useState } from 'react';
import { supabase } from '../supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(`Sign up failed: ${error.message}`);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        { id: data.user.id, username }
      ]);
      if (profileError) {
        alert(`Profile creation failed: ${profileError.message}`);
        return;
      }
    }

    alert('Sign up successful! Please sign in.');
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
      <form onSubmit={handleSignup} className="bg-neutral-900 border border-neutral-800/80 p-8 rounded-3xl w-full max-w-md space-y-6 shadow-2xl">
        <h1 className="text-2xl font-bold text-white text-center tracking-tight">Create Account</h1>
        <div>
          <label className="block text-xs text-neutral-400 mb-1 font-medium">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-neutral-600"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1 font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-neutral-600"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1 font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-neutral-600"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-white text-neutral-950 py-3.5 rounded-full font-bold text-sm hover:bg-neutral-200 transition shadow"
        >
          Sign Up
        </button>
        <p className="text-center text-xs text-neutral-500">
          Already have an account? <Link href="/login" className="text-white hover:underline font-medium">Sign In</Link>
        </p>
      </form>
    </main>
  );
}