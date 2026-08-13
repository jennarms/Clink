import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function PublicProfile({ username }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'found' | 'not-found'
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, theme_color')
        .eq('username', username)
        .single();

      if (!isMounted) return;

      if (profileError || !profileData) {
        setStatus('not-found');
        return;
      }

      setProfile(profileData);

      const { data: linksData, error: linksError } = await supabase
        .from('links')
        .select('id, title, url, icon')
        .eq('user_id', profileData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (!isMounted) return;

      if (!linksError) {
        setLinks(linksData || []);
      }
      setStatus('found');
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [username]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F9F8F3] flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="min-h-screen bg-[#F9F8F3] flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-[#2D5A27] mb-2">Linkie 🔗</h1>
        <p className="text-slate-600 mb-1">There's no page at /{username}.</p>
        <a href="/" className="text-sm text-[#2D5A27] hover:underline font-medium">
          Go to Linkie home
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col items-center px-4 py-14">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || profile.username}
              className="w-20 h-20 rounded-full object-cover border border-slate-200 mb-4"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#2D5A27]/15 mb-4" />
          )}
          <h1 className="text-xl font-bold text-[#1A1A1A]">
            {profile.display_name || `@${profile.username}`}
          </h1>
          <p className="text-sm text-slate-500">@{profile.username}</p>
          {profile.bio && (
            <p className="text-sm text-slate-600 mt-2 max-w-xs">{profile.bio}</p>
          )}
        </div>

        {links.length === 0 ? (
          <p className="text-xs text-slate-400 text-center">No links here yet.</p>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-3 px-4 bg-white border border-slate-200 rounded-xl font-medium text-sm text-[#1A1A1A] shadow-sm hover:border-[#2D5A27] hover:text-[#2D5A27] transition-colors"
              >
                {link.title}
              </a>
            ))}
          </div>
        )}

        <p className="text-center text-[11px] text-slate-300 mt-10">
          Made with Linkie 🔗
        </p>
      </div>
    </div>
  );
}