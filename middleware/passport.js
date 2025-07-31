const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const User = require('../models/User'); 
const UserLoginSMSModel = require('../models/UserLoginSMS');
require('dotenv').config();

const requestContext = require('../utils/requestContext');

const localLogin = new LocalStrategy(
    { usernameField: 'mobile', passwordField: 'otp', passReqToCallback: true },
    async (req, mobile, otp, done) => {
      try {
        const user = await User.findOne({ mobile });
  
        if (!user) {
          const error = new Error('Mobile number not found');
          error.status = 400;
          error.field = 'mobile';
          return done(error);
        }
        console.log('user', user);

        console.log('mobile', mobile);
        console.log('otp', otp);
  
        const otpRecord = await UserLoginSMSModel.findOne({ mobile: mobile, otp: otp , active: true });
        logger.info('OTP Record:', otpRecord);
        if (!otpRecord)
            return done({status: 400, message: 'INVALID OTP'});
        
        if (new Date() > otpRecord.expiryTime) {
          otpRecord.active = false;
          await otpRecord.save();
          return done( {status: 400, message: 'OTP EXPIRED'});
        }
        otpRecord.active = false;
        await otpRecord.save();

        // Set operatorId in request context
        const context = requestContext.get();
        context.operatorId = user.operatorId;
        requestContext.instance.storage.run(context, () => {
          return done(null, user);
        });
      } catch (err) {
        return done(err);
      }
    }
  );
  

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
};

const jwtLogin = new JwtStrategy(
    { ...opts },
    async (jwtPayload, done) => {
      try {
        const user = await User.findOne({ _id: jwtPayload._id });

        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        // Set operatorId in request context
        const context = requestContext.get();
        context.operatorId = user.operatorId;
        requestContext.instance.storage.run(context, () => {
          return done(null, user);
        });
      } catch (err) {
        return done(err, false, { message: 'Invalid token' });
      }
    }
  );
  

// Serialize user (used by Passport to save user in localStorage)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user (retrieve user details from LocalStorage)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Use the strategies
passport.use(localLogin);
passport.use(jwtLogin);

module.exports = passport;
