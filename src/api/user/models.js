'use strict'

import mongoose from 'mongoose'
import bcrypt from 'bcrypt-nodejs'
import jwt from 'jsonwebtoken'
import config from '../../config/config'

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: [true, 'E-Mail is required']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    validate: {
      validator (v) {
        // Minimum 6 characters at least 1 Alphabet and 1 Number:
        return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(v)
      },
      message: 'Minimum 6 characters at least 1 alphabet and 1 Number'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'demo'],
    default: 'user'
  },
  roles: {
    type: [String],
    default: ['user']
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'blocked'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  confirmationToken: String,
  resetPasswordToken: String,
  resetPasswordExpired: Date
})

UserSchema.pre('save', function preSave (next) {
  if (this.isModified('password')) {
    const salt = bcrypt.genSaltSync(10)
    // set hash
    this.password = bcrypt.hashSync(this.password, salt)
  }

  const now = new Date()

  this.updatedAt = now

  if (!this.createdAt) {
    this.createdAt = now
  }

  next()
})

/**
 * Authenticate method to compare the passed password
 *
 * @param password
 * @param next
 */
UserSchema.methods.authenticate = function authenticate (password, next) {
  bcrypt.compare(password, this.password, (err, isMatch) => {
    if (err) {
      throw new Error(err)
    }
    next(isMatch)
  })
}

/**
 * Method to generate the json webtoken;
 *
 * @param user
 * @param next
 */
UserSchema.methods.generateToken = function generateToken (user, next) {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role
  }

  const options = {
    expiresIn: 10080
  }

  const token = jwt.sign(payload, config.jwt.secret, options)

  next(`JWT ${token}`)
}

export default mongoose.model('User', UserSchema)
