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
  clientSecret: 'secret', // Replace with your Google Client Secret
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
      // Retrieve redirect URL from `state` parameter
      const baseRedirectUrl = req.query.state || 'https://google.com';
  
      // Extract all user data
      const { id, displayName, emails, photos, provider, _json } = req.user;
  
      // Prepare user data
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
  
      // Convert user data to query params
      const queryParams = new URLSearchParams(userData).toString();
      const redirectUrl = `${baseRedirectUrl}?${queryParams}`;
  
      console.log('Redirect 3 -->', redirectUrl);
      
      // Redirect with full user data
      // res.redirect(redirectUrl);


      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Login Successful</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    margin-top: 100px;
                }
                button {
                    padding: 10px 20px;
                    font-size: 16px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    cursor: pointer;
                    border-radius: 5px;
                }
                button:hover {
                    background-color: #45a049;
                }
            </style>
        </head>
        <body>
            <h1>Welcome,to mystic !</h1>
            
            <a href=${redirectUrl}>
                <button>Go to Dashboard</button>
            </a>
        </body>
        </html>
    `);
    });
  

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
