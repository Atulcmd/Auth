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
  profile.accessToken = accessToken
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

    const queryParams = new URLSearchParams(userData).toString();
    const redirectUrl = `${baseRedirectUrl}?${queryParams}`;

    console.log('User Data:', userData);
    console.log('Redirect 3 -->', redirectUrl);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Welcome to Mystic Motors</title>
          <style>
              body {
                  margin: 0;
                  background-color: #303030;
                  font-family: Arial, sans-serif;
                  text-align: center;
                  color: #ffffff;
              }
              #header {
                  display: block;
                  margin-top: 40px;
                  line-height: 50px;
                  background-color: #202020;
                  font-size: 24px;
                  padding: 10px 0;
              }
              #checkmark {
                  color: #00ff00;
                  margin-right: 10px;
              }
              #message {
                  display: block;
                  margin-top: 30px;
                  font-size: 18px;
              }
              button {
                  margin-top: 30px;
                  padding: 12px 24px;
                  font-size: 16px;
                  background-color: #4CAF50;
                  color: white;
                  border: none;
                  cursor: pointer;
                  border-radius: 6px;
              }
              button:hover {
                  background-color: #45a049;
              }
          </style>
      </head>
      <body>
          <span id="header"><span id="checkmark">✔</span> LOGIN SUCCESSFUL</span>
          <span id="message">Now you can return to Mystic Motors.</span>
          <br>
          <button onclick="copyAndRedirect()">Open the Game</button>

          <script>
              const redirectUrl = "${redirectUrl}";

              function copyAndRedirect() {
                  navigator.clipboard.writeText(redirectUrl)
                      .then(() => {
                          console.log('Redirect URL copied to clipboard');
                          window.location.href = redirectUrl;
                      })
                      .catch(err => {
                          console.error('Failed to copy: ', err);
                          window.location.href = redirectUrl;
                      });
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
