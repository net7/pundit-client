const ERRORS_MAP = {
  firstname: {
    required: '"First name" is a required field',
    maxlength: '"First name" must be max. 64 characters',
    minlength: '"First name" must be at least 2 characters'
  },
  lastname: {
    required: '"Last name" is a required field',
    maxlength: '"Last name" must be max. 64 characters',
    minlength: '"Last name" must be at least 2 characters'
  },
  email: {
    required: '"Email" is a required field',
    maxlength: '"Email" must be 254 max. characters',
    email: '"Email" must be a valid email address',
  },
  password: {
    required: '"Password" is a required field',
    maxlength: '"Password" must be max. 32 characters',
    minlength: '"Password" must be at least 8 characters'
  },
  termsconditions: {
    required: 'Please accept the Pundit\'s Terms and Conditions and Privacy Policy to create your account.'
  },
  tracking: {
    // required: 'Please accept the Pundit\'s use of personal data tracking to create your account.'
  },
  // confirmpassword: {
  //   required: '"Confirm Password" is a required field',
  // },
};

const SERVICE_ERRORS_MAP = {
  401: 'Incorrect email or password.',
  409: 'The email address you entered already exists.',
  500: 'We are unable to process your request at this time. Please try again later.',
  fallback: 'We are unable to process your request at this time. Please try again later.'
};

export default {
  getErrorMessage(input, errors) {
    let error = null;
    Object.keys(ERRORS_MAP[input]).forEach((errorType) => {
      const hasError = errors ?
        ['minlength', 'maxlength'].includes(errorType)
          ? !!errors[errorType]?.requiredLength
          : !!errors[errorType]
        : null;

      if (hasError) {
        error = ERRORS_MAP[input][errorType];
      }
    });
    return error;
  },
  getServiceErrorMessage(status): string {
    return SERVICE_ERRORS_MAP[status] || SERVICE_ERRORS_MAP.fallback;
  }
};
