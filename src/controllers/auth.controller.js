import {
  registerUser,
  authenticateUser,
  getCurrentUser,
} from "../services/auth.service.js";

export async function register(req, res, next) {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const user = await authenticateUser(req.body);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    req.session.regenerate((sessionError) => {
      if (sessionError) {
        return next(sessionError);
      }

      req.session.userId = user.id;

      req.session.save((saveError) => {
        if (saveError) {
          return next(saveError);
        }

        res.json({
          success: true,
          message: "Login successful",
          user,
        });
      });
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie("studysprint.sid");

    res.json({
      success: true,
      message: "Logout successful",
    });
  });
}

export async function me(req, res, next) {
  try {
    const user = await getCurrentUser(req.session.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
}