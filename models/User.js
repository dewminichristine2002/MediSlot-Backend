// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    contact_no: {
      type: String,
      required: true,
      trim: true,
      // adjust to your locale if needed
      match: [/^[0-9]{10,15}$/, 'Invalid contact number'],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional username (sparse so null/undefined allowed for most users)
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // never return by default
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    user_category: {
      type: String,
      enum: ['patient', 'healthCenterAdmin', 'admin'],
      default: 'patient',
    },

    // 🔗 Link a health-center admin account to its HealthCenter
    center: {
      type: Schema.Types.ObjectId,
      ref: 'HealthCenter',
      default: null,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // present "id" consistently, strip sensitive/internal fields
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password; // just in case it was explicitly selected
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Useful indexes (email already unique above)
UserSchema.index({ contact_no: 1 });
// username is already unique+sparse in field definition

// Hash password when set/changed
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare candidate password (remember to .select('+password') when fetching)
UserSchema.methods.comparePassword = function (candidatePassword) {
  // return a promise
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
