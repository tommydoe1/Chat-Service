import express from "express";
import passport from "passport";

const router = express.Router();

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const userData = (req.user as any);
    const token = userData?.token;
    const user = userData?.user;

    const userEncoded = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username
    }));

    res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
  }
);

export default router;
