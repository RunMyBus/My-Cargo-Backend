const StaticPhoneNumbers = require('../models/staticPhoneNumbers');
const UserLoginSMSModel = require('../models/UserLoginSMS');
const config = process.env;

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const validateAndCreateOTP = async (mobile) => {
    try {
        const OTP_EXPIRY_MINUTES = 10;
        let OTP;
        let isStatic = false;
        const expiryTime = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Check if mobile is a static number
        const isStaticNumber = await StaticPhoneNumbers.exists({ mobile });
        if (isStaticNumber) {
            OTP = Number(config.STATIC_OTP);
            isStatic = true;
        }
        // Generate new OTP for other than static numbers
        else {
            OTP = generateOTP();
        }

        // Create record in database
        await UserLoginSMSModel.create({
            mobile: mobile,
            otp: OTP,
            expiryTime
        });

        return {
            OTP,
            isStatic
        };
    } catch (error) {
        console.error("Error in generateAndCreateOTP:", error);
        throw error;
    }
}

module.exports = {
    validateAndCreateOTP
}