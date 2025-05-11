import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/user.model';
import { generateToken } from '../utils/jwt';
import { Sequelize, Op } from 'sequelize';

export const register = async (req: Request, res: Response) => {
  const {
    username,
    password,
    confirmPassword,
    firstName,
    lastName,
    email,
    mobile,
  } = req.body;

  const missingFields: string[] = [];
  if (!username) missingFields.push("username");
  if (!password) missingFields.push("password");
  if (!confirmPassword) missingFields.push("confirmPassword");
  if (!firstName) missingFields.push("firstName");
  if (!lastName) missingFields.push("lastName");
  if (!email) missingFields.push("email");
  if (!mobile) missingFields.push("mobile");

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: false,
      message: `Missing required field(s): ${missingFields.join(", ")}`,
      data: { missingFields },
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      status: false,
      message: "Password and confirm password do not match.",
      data: {},
    });
  }

  try {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }, { mobile }],
      },
    });

    if (existingUser) {
      const conflictField =
        existingUser.username === username ? "Username" :
        existingUser.email === email ? "Email" :
        "Mobile number";

      return res.status(409).json({
        status: false,
        message: `${conflictField} already exists.`,
        data: {},
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      firstName,
      lastName,
      email,
      mobile,
    });

    return res.status(201).json({
      status: true,
      message: "User registered successfully",
      data: { userId: user.id },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "Server error during registration.",
      data: {},
    });
  }
};


export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    const missingFields = [];
    if (!username) missingFields.push("username");
    if (!password) missingFields.push("password");

    return res.status(400).json({
      status: false,
      message: `Missing required field(s): ${missingFields.join(", ")}`,
      data: { missingFields },
    });
  }

  try {
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
        data: {},
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: "Invalid credentials.",
        data: {},
      });
    }

    // Update last login timestamp
    await user.update({ lastLogin: new Date() });

    const token = generateToken(user.id);

    return res.status(200).json({
      status: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "Server error during login.",
      data: {},
    });
  }
};
