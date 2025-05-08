const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// Session setup
app.use(session({
  secret: 'your-secret-key', // Replace with a strong secret key
  resave: false,
  saveUninitialized: true,
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport Google OAuth2.0 Strategy
passport.use(new GoogleStrategy({
  clientID: '816883803515-tefohtu8b245hvtmuph3sa7m0as725th.apps.googleusercontent.com', // Replace with your Google Client ID
  clientSecret: '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', // Replace with your Google Client Secret
  callbackURL: 'https://google-auth-9uco.onrender.com/auth/google/callback',
  passReqToCallback: true, // Allow passing the request to store state manually
}, (req, accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Automatically trigger Google Login
app.get('/', (req, res) => {
  const redirectUrl = req.query.redirect || 'https://google.com'; // Default to Google
  console.log('Redirect 1 -->', redirectUrl);

  // Redirect to Google OAuth with state
  const authUrl = `/auth/google?state=${encodeURIComponent(redirectUrl)}`;
  res.redirect(authUrl);
});

// Google Login route with `state`
app.get('/auth/google', (req, res, next) => {
  const redirectUrl = req.query.state || 'https://google.com';
  console.log('Redirect 2 -->', redirectUrl);

  passport.authenticate('google', { 
    scope: ['profile', 'email'], 
    state: redirectUrl 
  })(req, res, next);
});

// Google Login callback route
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    const { id, displayName, emails, photos, provider, _json } = req.user;

    // Build raw user JSON
    const userData = {
      id: id,
      name: displayName,
      email: emails?.[0]?.value || 'unknown',
      picture: photos?.[0]?.value || '',
      provider: provider,
      firstName: _json.given_name || '',
      lastName: _json.family_name || '',
      locale: _json.locale || '',
      profileUrl: _json.profile || '',
    };

    const rawJson = JSON.stringify(userData, null, 2);

    // Serve a minimal HTML page with clipboard support
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login Successful</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: sans-serif; padding: 20px; text-align: center; }
          textarea { width: 90%; height: 200px; margin-top: 20px; font-family: monospace; font-size: 14px; }
          button { padding: 10px 20px; font-size: 16px; margin-top: 10px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h2>✅ Login Successful</h2>
        <p>Below is your raw user data:</p>
        <textarea id="userData" readonly>${rawJson}</textarea><br/>
        <button onclick="copyManually()">📋 Tap to Copy</button>

        <script>
          const rawData = ${JSON.stringify(rawJson)};
          
          // Attempt auto-copy for Unity Editor/Desktop
          navigator.clipboard.writeText(rawData).then(() => {
            console.log('✅ Auto-copied to clipboard');
          }).catch(err => {
            console.warn('❌ Auto-copy failed:', err);
          });

          function copyManually() {
            const textarea = document.getElementById('userData');
            textarea.select();
            document.execCommand('copy');
            alert('📋 Copied to clipboard!');
          }
        </script>
      </body>
      </html>
    `);
  }
);


  

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
