IMPORTANT: Do not change any visual design. This is a logic-only fix for authentication state.

BUG: After clicking the magic link from email, the user is redirected back to the site but:
1. The app does not recognize they are logged in
2. Clicking "Share book link" shows the registration modal again
3. The auth session from the magic link is lost

FIX — Auth session detection on page load:

The problem is that when Supabase redirects back after magic link confirmation, it adds auth tokens to the URL hash (e.g. #access_token=xxx&refresh_token=yyy). The app must detect and process these tokens on load.

Add this initialization logic that runs ONCE when the app first mounts:

// 1. On app load, detect auth tokens from magic link redirect
useEffect(() => {
  const initAuth = async () => {
    // This call detects tokens in the URL hash AND restores existing sessions from cookies
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session) {
      setUser(session.user);
      setIsAuthenticated(true);
      
      // Migrate localStorage stamps if any exist
      const localStamps = JSON.parse(localStorage.getItem('figmatelia_stamps') || '[]');
      if (localStamps.length > 0) {
        for (const stamp of localStamps) {
          await supabase.from('stamps').insert({
            user_id: session.user.id,
            image_data: stamp.imageData,
            name: stamp.name,
            rotation: stamp.rotation || 0,
            zoom: stamp.zoom || 1,
            created_at: stamp.createdAt || new Date().toISOString()
          });
        }
        localStorage.removeItem('figmatelia_stamps');
      }
      
      // Clean the URL hash so tokens don't stay visible
      if (window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  };
  
  initAuth();

  // 2. Listen for future auth changes (login, logout, token refresh)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        setIsAuthenticated(true);
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);

// 3. Store auth state in a React state variable that persists across views
const [user, setUser] = useState(null);
const [isAuthenticated, setIsAuthenticated] = useState(false);

// 4. Use isAuthenticated to control behavior:
// - "Share book link" button: if isAuthenticated → show share sheet, else → show registration modal
// - Saving stamps: if isAuthenticated → save to Supabase, else → save to localStorage
// - Registration modal: only show if !isAuthenticated

// 5. When fetching stamps for the Stampbook grid:
// if isAuthenticated → fetch from Supabase: supabase.from('stamps').select('*').eq('user_id', user.id)
// if !isAuthenticated → read from localStorage

CRITICAL: The isAuthenticated state must be checked EVERY TIME the user taps "Share book link" or "Save in stamp book". Do not rely on whether it's the "first stamp" — check the actual auth state from Supabase.