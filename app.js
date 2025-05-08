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

    const userDataStr = JSON.stringify(userData);

    // Return HTML with JS to copy to clipboard
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login Complete</title>
        <style>
          body { font-family: sans-serif; padding: 2em; text-align: center; }
          .box { background: #f0f0f0; padding: 20px; border-radius: 10px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="box">
          <h2>✅ Login Successful!</h2>
          <p>User data has been copied to your clipboard.</p>
          <p>You can now return to the Unity Editor.</p>
        </div>
        <script>
          const data = ${JSON.stringify(userDataStr)};
          navigator.clipboard.writeText(data).then(() => {
            console.log('User data copied to clipboard!');
          }).catch(err => {
            console.error('Failed to copy:', err);
          });
        </script>
      </body>
      </html>
    `);
  }
);

  

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
