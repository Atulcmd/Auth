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
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
  callbackURL: 'https://your-callback-url',
  passReqToCallback: true,
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
    const baseRedirectUrl = req.query.state || 'https://google.com';
    
    // Extract all user data
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

    console.log('User Data:', userData);

    const queryParams = new URLSearchParams(userData).toString();
    const redirectUrl = `${baseRedirectUrl}?${queryParams}`;

    console.log('Redirect 3 -->', redirectUrl);

    // If the URL contains 'unityEditor', send the data to be copied to clipboard
    if (baseRedirectUrl.includes('unityEditor')) {
      res.send(`
        <html>
          <body>
            <script>
              // Copy to clipboard
              const userData = ${JSON.stringify(userData)};
              const textToCopy = JSON.stringify(userData);
              navigator.clipboard.writeText(textToCopy).then(() => {
                alert("User data copied to clipboard for Unity Editor!");
                window.close();  // Close the window after copying
              });
            </script>
            <h1>Data copied to clipboard</h1>
          </body>
        </html>
      `);
    } else {
      // Otherwise, show the 'OpenGame' button
      res.send(`
        <html>
          <body>
            <h1>Welcome, ${userData.name}</h1>
            <button onclick="window.location.href='${baseRedirectUrl}'">Open Game</button>
          </body>
        </html>
      `);
    }
  }
);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
