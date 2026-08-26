import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const STATUS_VERIFYING = 'verifying';
const STATUS_DELETING = 'deleting';
const STATUS_ERROR = 'error';

// Route this at /confirm-delete-account.
// When the user clicks the link from their email, Supabase automatically
// exchanges the token in the URL for a session (detectSessionInUrl is on
// by default). Once we see that session, we finish the deletion.
export default function ConfirmDeleteAccount() {
  const [status, setStatus] = useState(STATUS_VERIFYING);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const finishDeletion = async () => {
      if (cancelled) return;
      setStatus(STATUS_DELETING);

      const { error: deleteError } = await supabase.rpc('delete_own_account');

      if (cancelled) return;

      if (deleteError) {
        setStatus(STATUS_ERROR);
        setError(deleteError.message);
        return;
      }

      await supabase.auth.signOut();
      navigate('/', { replace: true, state: { accountDeleted: true } });
    };

    // Case 1: session is already there by the time this mounts.
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        finishDeletion();
      }
    });

    // Case 2: session arrives slightly after mount (Supabase is still
    // parsing the URL). Listen for it.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        finishDeletion();
      }
    });

    // Case 3: neither fired within a few seconds -> link was invalid/expired.
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setStatus((current) => {
        if (current === STATUS_VERIFYING) {
          setError('This link is invalid or has expired. Please request a new one.');
          return STATUS_ERROR;
        }
        return current;
      });
    }, 8000);

    return () => {
      cancelled = true;
      listener?.subscription?.unsubscribe();
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        {status === STATUS_ERROR ? (
          <>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Something went wrong</h2>
            <p className="text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-[#2D5A27] hover:underline font-medium"
            >
              ← Back to home
            </button>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 mb-1 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">
              {status === STATUS_DELETING ? 'Deleting your account...' : 'Confirming...'}
            </h2>
            <p className="text-sm text-slate-500">This will only take a moment.</p>
          </>
        )}
      </div>
    </div>
  );
}