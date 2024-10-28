// import passport from "passport";
// import GoogleStrategy from "passport-google-oauth2";
// import jwt from "jsonwebtoken";
// import pool from "../utils/db.js";
// import env from "dotenv";

// env.config();
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.ID,
//       clientSecret: process.env.SECRET,
//       callbackURL: "https://medical-backend-project.onrender.com/auth/google/callback", // backend url
//       passReqToCallback: true, // Allows passing the req object to the callback
//     },
//     async (req, accessToken, refreshToken, profile, done) => {
//       try {
//         const email = profile.emails[0].value;
//         const fullName = profile.displayName || "Google User";

//         // Prepare session data
//         const now = new Date().toISOString();
//         const loginData = {
//           login_time: now,
//           ip_address: req.ip, // Capture the IP address
//           user_agent: req.headers["user-agent"], // Capture the User Agent
//         };

//         const sessionExpiry = new Date(
//           Date.now() + 24 * 60 * 60 * 1000
//         ).toISOString(); // 24 hours from now
//         const role = "user"; // Default role for new users

//         // Check if user already exists
//         const result = await pool.query(
//           "SELECT * FROM users WHERE email = $1",
//           [email]
//         );

//         let user;
//         if (result.rows.length === 0) {
//           // Insert a new user with session data
//           const newUser = await pool.query(
//             `INSERT INTO users (email, password_hash, session_expiry, session_data, role, full_name)
//              VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
//             [
//               email,
//               "google", // Using 'google' as a placeholder for password
//               sessionExpiry,
//               JSON.stringify(loginData),
//               role,
//               fullName,
//             ]
//           );
//           user = newUser.rows[0];
//         } else {
//           user = result.rows[0];

//           // Update existing user's session data on login
//           await pool.query(
//             `UPDATE users SET session_data = $1, session_expiry = $2 WHERE id = $3`,
//             [JSON.stringify(loginData), sessionExpiry, user.id]
//           );
//         }

//         // Generate JWT token
//         if (!process.env.JWT_SECRET) {
//           throw new Error("JWT_SECRET is not defined");
//         }

//         const token = jwt.sign(
//           { id: user.id, role: user.role },
//           process.env.JWT_SECRET,
//           {
//             expiresIn: "1h",
//           }
//         );

//         // Return user and token
//         return done(null, { user, token });
//       } catch (err) {
//         return done(err);
//       }
//     }
//   )
// );

// // Serialization
// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });

// // Deserialization
// passport.deserializeUser(async (id, done) => {
//   try {
//     const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
//     done(null, result.rows[0]);
//   } catch (error) {
//     done(error, null);
//   }
// });

// // Exporting authentication routes
// export const googleAuthRoutes = (app) => {
//   app.get(
//     "/auth/google",
//     passport.authenticate("google", { scope: ["profile", "email"] })
//   );

//   app.get(
//     "/auth/google/callback",
//     passport.authenticate("google", { session: false }),
//     (req, res) => {
//       const token = req.user.token;

//       // Set the cookie before redirecting
//       res.cookie("token", token, {
//         httpOnly: false,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "Lax",
//         maxAge: 3600000, // 1 hour
//       });

//       // Send the token as part of the response
//       res.redirect(
//         `https://suriya-haidari.github.io/medical-frontend/emergency?token=${token}`
//       );
//     }
//   );

//   app.get("/googlelogout", (req, res) => {
//     req.logOut((err) => {
//       if (err) console.log(err);
//     });
//     res.redirect("/"); // Adjust redirect as needed
//   });
// };




import passport from "passport";
import GoogleStrategy from "passport-google-oauth2";
import jwt from "jsonwebtoken";
import pool from "../utils/db.js";
import sendMail from "../notification.js";
import env from "dotenv";

env.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.ID,
      clientSecret: process.env.SECRET,
      callbackURL:
        "https://medical-backend-project.onrender.com/auth/google/callback",
      passReqToCallback: true, // Allows passing the req object to the callback
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const fullName = profile.displayName || "Google User";

        // Prepare session data
        const now = new Date().toISOString();
        const loginData = {
          login_time: now,
          ip_address: req.ip, // Capture the IP address
          user_agent: req.headers["user-agent"], // Capture the User Agent
        };

        const sessionExpiry = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString(); // 24 hours from now
        const role = "user"; // Default role for new users

        // Check if user already exists
        const result = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        );

        let user;
        let isNewUser = false;

        if (result.rows.length === 0) {
          // Insert a new user with session data
          const newUser = await pool.query(
            `INSERT INTO users (email, password_hash, session_expiry, session_data, role, full_name)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [
              email,
              "google", // Using 'google' as a placeholder for password
              sessionExpiry,
              JSON.stringify(loginData),
              role,
              fullName,
            ]
          );
          user = newUser.rows[0];
          isNewUser = true; // Track that this is a new user
        } else {
          user = result.rows[0];

          // Update existing user's session data on login
          await pool.query(
            `UPDATE users SET session_data = $1, session_expiry = $2 WHERE id = $3`,
            [JSON.stringify(loginData), sessionExpiry, user.id]
          );
        }

        // Generate JWT token
        if (!process.env.JWT_SECRET) {
          throw new Error("JWT_SECRET is not defined");
        }

        const token = jwt.sign(
          { id: user.id, role: user.role },
          process.env.JWT_SECRET,
          {
            expiresIn: "1d",
          }
        );

        // Send email only if it's a new user
        if (isNewUser) {
          await sendMail(fullName, email); // Send welcome email
        }

        // Return user and token
        return done(null, { user, token });
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialization
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

// Exporting authentication routes
export const googleAuthRoutes = (app) => {
  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { session: false }),
    (req, res) => {
      const token = req.user.token;

      // Set the cookie before redirecting
      res.cookie("token", token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
      });

      // Send the token as part of the response
      res.redirect(
        `https://suriya-haidari.github.io/medical-frontend/emergency?token=${token}`
      );
    }
  );

  app.get("/googlelogout", (req, res) => {
    req.logOut((err) => {
      if (err) console.log(err);
    });
    res.redirect("/"); // Adjust redirect as needed
  });
};
