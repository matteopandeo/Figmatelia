Add Supabase integration to the existing app:

1. INITIALIZATION:
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)

2. AUTH STATE:
On app load, check supabase.auth.getSession().
- If authenticated → fetch stamps from Supabase table "stamps" where user_id matches
- If not authenticated → read stamps from localStorage key "figmatelia_stamps"
Listen to supabase.auth.onAuthStateChange() to handle login/logout.

3. SAVE STAMP:
When saving a stamp:
- If authenticated → INSERT into Supabase "stamps" table: { user_id, image_data (base64), name, rotation, zoom, created_at }
- If not authenticated → append to localStorage array

4. MIGRATION after first login:
When a user authenticates for the first time, check localStorage for existing stamps. If found:
- Upload each to Supabase stamps table with the new user_id
- Clear localStorage stamps after successful migration
- Show a brief toast: "Your stamps have been saved to your account"

5. PUBLIC STAMPBOOK:
On first authentication, generate a slug (lowercase username or random 8-char string). INSERT into "stampbooks" table: { user_id, slug, title: "My Figmatelia" }.
The public page at /book/{slug} queries Supabase:
- Fetch stampbook by slug
- Fetch all stamps for that stampbook's user_id
- Display in read-only grid (no auth required — Supabase RLS allows public read on stamps if stampbook has a slug)

6. SUPABASE RLS POLICIES:
- stamps: SELECT allowed for everyone (public gallery). INSERT/UPDATE/DELETE only for authenticated user matching user_id.
- stampbooks: SELECT allowed for everyone. INSERT/UPDATE only for authenticated user matching user_id.

7. MAGIC LINK FIX (CRITICAL):
The "Continue with email" magic link flow does NOT work with default Supabase settings on custom domains like figma.site. Here is the correct implementation:

When calling signInWithOtp, you MUST specify the emailRedirectTo option pointing back to your app's URL. Without this, Supabase redirects to localhost or the Supabase dashboard, and the magic link never completes.

// WRONG — will not work on figma.site:
await supabase.auth.signInWithOtp({ email: userEmail })

// CORRECT — always specify redirect:
await supabase.auth.signInWithOtp({
  email: userEmail,
  options: {
    emailRedirectTo: window.location.origin  // e.g. https://figmatelia.figma.site
  }
})

Additionally, handle the auth callback on page load. When the user clicks the magic link in their email, Supabase redirects back to your app with auth tokens in the URL hash. The Supabase client handles this automatically IF you call getSession() on load:

// On app initialization (useEffect on mount):
useEffect(() => {
  // This detects the auth tokens in the URL hash from magic link redirect
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      setUser(session.user);
      migrateLocalStamps(session.user.id);
    }
  });

  // Listen for auth state changes (login, logout, token refresh)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        await migrateLocalStamps(session.user.id);
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);

For Google OAuth, also specify the redirect:

await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin
  }
})

SUPABASE DASHBOARD SETTINGS REQUIRED (do this manually in supabase.com):
- Go to Authentication → URL Configuration
- Set "Site URL" to your figma.site URL (e.g. https://figmatelia.figma.site)
- Add your figma.site URL to "Redirect URLs" allowlist (e.g. https://figmatelia.figma.site/**)
- Under Authentication → Email Templates, verify the magic link template uses {{ .ConfirmationURL }} (this is the default, don't change it)
- Under Authentication → Providers, make sure "Email" provider is enabled with "Confirm email" turned ON and "Secure email change" turned ON

After the user sends a magic link:
- Show a confirmation state in the modal: "Check your email! We sent a magic link to {email}. Click it to sign in."
- Add a "Resend" button that becomes active after 60 seconds
- Add a "Use a different email" link to go back to the email input

The complete magic link flow:
1. User taps "Continue with email"
2. Modal shows email input + "Send magic link" button
3. User enters email, taps send
4. Call supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
5. Show confirmation: "Check your email!" with resend option
6. User opens email, clicks magic link
7. Browser redirects to figmatelia.figma.site with tokens in URL
8. supabase.auth.getSession() picks up the tokens
9. onAuthStateChange fires with SIGNED_IN event
10. App migrates localStorage stamps → Supabase, navigates to Stampbook