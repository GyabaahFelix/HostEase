import { Request, Response } from 'express';
import { DBEngine, hashPassword, comparePassword } from '../db/db';
import { User, UserRole } from '../types';
import crypto from 'crypto';

// In-memory Session Store for secure session management
export const SessionStore = new Map<string, { userId: string; expiresAt: number }>();

// Expiry of 24 hours
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, name, matricNoOrStaffId, gender, phone, department } = req.body;

      // Basic input validation
      if (!username || !email || !password || !name || !matricNoOrStaffId || !gender || !phone) {
        res.status(400).json({ error: 'All primary fields are required.' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters.' });
        return;
      }

      const users = DBEngine.getUsers();

      // Check unique constraints
      const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        res.status(400).json({ error: 'Email is already registered.' });
        return;
      }

      const usernameExists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
      if (usernameExists) {
        res.status(400).json({ error: 'Username is already taken.' });
        return;
      }

      const matricExists = users.some(u => u.matricNoOrStaffId.toLowerCase() === matricNoOrStaffId.toLowerCase());
      if (matricExists) {
        res.status(400).json({ error: 'Matriculation or Staff ID is already registered.' });
        return;
      }

      // Default role is student. System Admins must be created manually or seeded.
      const newUser: User = {
        id: `usr_${crypto.randomBytes(8).toString('hex')}`,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: hashPassword(password),
        role: 'student',
        name: name.trim(),
        matricNoOrStaffId: matricNoOrStaffId.trim().toUpperCase(),
        gender: gender as 'male' | 'female' | 'other',
        phone: phone.trim(),
        department: department?.trim() || '',
        createdAt: new Date().toISOString(),
        isEmailVerified: false,
        emailVerificationToken: `verify_${crypto.randomBytes(16).toString('hex')}`,
      };

      DBEngine.addUser(newUser);

      // Create Session automatically
      const token = `token_${crypto.randomBytes(32).toString('hex')}`;
      SessionStore.set(token, {
        userId: newUser.id,
        expiresAt: Date.now() + SESSION_EXPIRY_MS,
      });

      // Send response (omit passwordHash)
      const { passwordHash: _, ...userResponse } = newUser;
      res.status(201).json({
        message: 'Student registered successfully',
        token,
        user: userResponse,
      });
    } catch (error: any) {
      console.error('Error in registration controller:', error);
      res.status(500).json({ error: 'Internal server error during registration.' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { emailOrUsername, password } = req.body;

      if (!emailOrUsername || !password) {
        res.status(400).json({ error: 'Please provide email or username, and password.' });
        return;
      }

      const users = DBEngine.getUsers();
      const user = users.find(
        u => u.email.toLowerCase() === emailOrUsername.toLowerCase() || 
             u.username.toLowerCase() === emailOrUsername.toLowerCase()
      );

      if (!user) {
        res.status(401).json({ error: 'Invalid login credentials.' });
        return;
      }

      const isPasswordValid = comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid login credentials.' });
        return;
      }

      // Create session
      const token = `token_${crypto.randomBytes(32).toString('hex')}`;
      SessionStore.set(token, {
        userId: user.id,
        expiresAt: Date.now() + SESSION_EXPIRY_MS,
      });

      const { passwordHash: _, ...userResponse } = user;
      res.status(200).json({
        message: 'Login successful',
        token,
        user: userResponse,
      });
    } catch (error: any) {
      console.error('Error in login controller:', error);
      res.status(500).json({ error: 'Internal server error during login.' });
    }
  }

  static async me(req: Request, res: Response): Promise<void> {
    try {
      // User is injected by authMiddleware
      const user = (req as any).user as User;
      const { passwordHash: _, ...userResponse } = user;
      res.status(200).json(userResponse);
    } catch (error: any) {
      console.error('Error in me controller:', error);
      res.status(500).json({ error: 'Internal server error retrieving profile.' });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        SessionStore.delete(token);
      }

      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Error in logout controller:', error);
      res.status(500).json({ error: 'Internal server error during logout.' });
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { emailOrUsername } = req.body;
      if (!emailOrUsername) {
        res.status(400).json({ error: 'Please provide registered email or username.' });
        return;
      }

      const users = DBEngine.getUsers();
      const user = users.find(
        u => u.email.toLowerCase() === emailOrUsername.toLowerCase() || 
             u.username.toLowerCase() === emailOrUsername.toLowerCase()
      );

      if (!user) {
        // Return a 200/generic success message for security but with simulated debug info for academic presentation
        res.status(200).json({
          message: 'If the account exists, a password reset token has been generated.',
          simulatedToken: null,
        });
        return;
      }

      const resetToken = `reset_${crypto.randomBytes(16).toString('hex')}`;
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour expiry

      DBEngine.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: expiresAt,
      });

      res.status(200).json({
        message: 'If the account exists, a password reset token has been generated.',
        simulatedToken: resetToken,
        instructions: `Copy the simulated reset token below to reset your password. In production, this would be sent to: ${user.email}`,
      });
    } catch (error: any) {
      console.error('Error in forgotPassword:', error);
      res.status(500).json({ error: 'Internal server error processing password reset.' });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        res.status(400).json({ error: 'Token and new password are required.' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters.' });
        return;
      }

      const users = DBEngine.getUsers();
      const user = users.find(
        u => u.passwordResetToken === token && u.passwordResetExpires && u.passwordResetExpires > Date.now()
      );

      if (!user) {
        res.status(400).json({ error: 'Invalid or expired password reset token.' });
        return;
      }

      DBEngine.updateUser(user.id, {
        passwordHash: hashPassword(newPassword),
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
      });

      res.status(200).json({ message: 'Password reset successful. You can now log in.' });
    } catch (error: any) {
      console.error('Error in resetPassword:', error);
      res.status(500).json({ error: 'Internal server error updating password.' });
    }
  }

  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      if (!token) {
        res.status(400).json({ error: 'Verification token is required.' });
        return;
      }

      const users = DBEngine.getUsers();
      const user = users.find(u => u.emailVerificationToken === token);

      if (!user) {
        res.status(400).json({ error: 'Invalid or expired email verification token.' });
        return;
      }

      DBEngine.updateUser(user.id, {
        isEmailVerified: true,
        emailVerificationToken: undefined,
      });

      res.status(200).json({ message: 'Email verified successfully! Your account is now fully active.' });
    } catch (error: any) {
      console.error('Error in verifyEmail:', error);
      res.status(500).json({ error: 'Internal server error verifying email.' });
    }
  }

  static async sendVerificationEmail(req: Request, res: Response): Promise<void> {
    try {
      // User is injected by authMiddleware
      const user = (req as any).user as User;
      
      if (user.isEmailVerified) {
        res.status(400).json({ error: 'Email is already verified.' });
        return;
      }

      const verificationToken = `verify_${crypto.randomBytes(16).toString('hex')}`;
      DBEngine.updateUser(user.id, {
        emailVerificationToken: verificationToken,
      });

      res.status(200).json({
        message: 'Simulated email verification link sent.',
        simulatedToken: verificationToken,
        instructions: `Copy the simulated verification token below to verify your email. In production, this would be sent to: ${user.email}`,
      });
    } catch (error: any) {
      console.error('Error in sendVerificationEmail:', error);
      res.status(500).json({ error: 'Internal server error triggering verification.' });
    }
  }
}
