import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [message, setMessage] = useState('');

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  // Link manager state
  const [links, setLinks] = useState([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  // 1. Fetch user's links from Supabase
  const fetchLinks = async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching links:', error.message);
    } else {
      setLinks(data || []);
    }
  };

  // 2. Listen for Auth session changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) fetchLinks(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) fetchLinks(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Login / Signup Handler
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: data.user.id, username: username || email.split('@')[0] }]);

          if (profileError) console.error('Profile creation error:', profileError.message);
        }

        setMessage('Account created successfully! You can now sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 4. Add Link Handler
  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!title || !url || !session) return;

    // Ensure URL has protocol
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`;

    const { error } = await supabase
      .from('links')
      .insert([
        {
          user_id: session.user.id,
          title,
          url: formattedUrl,
        },
      ]);

    if (error) {
      alert(error.message);
    } else {
      setTitle('');
      setUrl('');
      fetchLinks(session.user.id);
    }
  };

  // 5. Delete Link Handler
  const handleDeleteLink = async (id) => {
    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', id);

    if (error) {
      alert(error.message);
    } else {
      fetchLinks(session.user.id);
    }
  };

  // 6. Sign Out Handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLinks([]);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
        <h1 className="text-3xl font-bold text-center text-pink-400 mb-2">Linkie 🌸</h1>

        {!session ? (
          /* AUTH FORM */
          <div>
            <h2 className="text-lg font-semibold text-center mb-6 text-slate-300">
              {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h2>

            {message && (
              <div className="mb-4 p-3 rounded bg-slate-700 text-sm text-pink-300 text-center">
                {message}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-400">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-pink-500 text-sm"
                    placeholder="jennarms"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-400">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-pink-500 text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-400">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-pink-500 text-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-pink-500 hover:bg-pink-600 font-semibold text-sm rounded-lg transition disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setMessage('');
                }}
                className="text-sm text-pink-400 hover:underline cursor-pointer"
              >
                {authMode === 'login'
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'}
              </button>
            </div>
          </div>
        ) : (
          /* DASHBOARD */
          <div>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
              <span className="text-sm text-slate-400 truncate max-w-[200px]">
                {session.user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md font-medium text-slate-200 cursor-pointer"
              >
                Log Out
              </button>
            </div>

            {/* Add Link Form */}
            <form onSubmit={handleAddLink} className="space-y-3 mb-6">
              <h3 className="font-medium text-slate-200 text-sm">Add New Link</h3>
              <input
                type="text"
                placeholder="Title (e.g. My Portfolio)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-pink-500"
              />
              <input
                type="text"
                placeholder="URL (e.g. instagram.com/user)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-pink-500"
              />
              <button
                type="submit"
                className="w-full py-2 bg-pink-500 hover:bg-pink-600 font-medium text-sm rounded-lg transition cursor-pointer"
              >
                + Add Link
              </button>
            </form>

            {/* Links List */}
            <div>
              <h3 className="font-medium text-slate-200 mb-3 text-sm">
                Your Links ({links.length})
              </h3>
              {links.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No links added yet!</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-lg group"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate mr-2 flex-1"
                      >
                        <div className="font-semibold text-pink-300 text-sm hover:underline truncate">
                          {link.title}
                        </div>
                        <div className="text-xs text-slate-400 truncate">{link.url}</div>
                      </a>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="text-xs text-red-400 hover:text-red-300 p-1 opacity-80 group-hover:opacity-100 cursor-pointer"
                        title="Delete link"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}