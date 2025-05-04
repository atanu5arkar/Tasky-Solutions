import { body, query, validationResult } from "express-validator";

function signupValidator() {
    return [
        body('name')
            .isLength({ min: 4 })
            .withMessage('We need at least 4 letters for your name.'),

        body('email')
            .isEmail()
            .withMessage('The email must be a valid address.'),

        body('phone')
            .isMobilePhone('en-IN', { strictMode: true })
            .withMessage('Why not type 10 digits only? No more no less.'),

        body('password')
            .isLength({ min: 6, max: 12 })
            .withMessage('The password must be of 6 to 12 characters.'),

        body('confirmPassword')
            .custom((value, { req }) => {
                if (value == req.body.password) return true;
                return false;
            })
            .withMessage('Please re-type your password correctly.')
    ];
}

function loginValidator() {
    return body('email')
        .isEmail()
        .withMessage('Please provide a valid Email.');
}

function profileDataValidator() {
    return [
        body('newEmail')
            .optional()
            .isEmail()
            .withMessage('The email must be a valid address.'),

        body('newPhone')
            .optional()
            .isMobilePhone('en-IN', { strictMode: true })
            .withMessage('Why not type +91, and then 10 digits?')
    ]
}

function taskValidator() {
    return [
        body('task')
            .isLength({ min: 5 })
            .withMessage('Type some more pls, at least 5 letters.'),

        body('deadline')
            .custom((value) => {
                // Check for valid date string
                if (isNaN(Date.parse(value))) return false;

                const
                    ms = new Date(value) - new Date(),
                    mins = ms / (1000 * 60),
                    days = mins / (60 * 24);

                if (mins >= 2 && days <= 30) return true;
                else return false;
            })
            .withMessage('The deadline must be after 15 mins and within the next 30 days.'),

        body('alertType')
            .custom(value => {
                const validTypes = ['sms', 'email', 'both'];
                if (validTypes.includes(value)) return true;
                return false;

            })
            .withMessage('Please mention an Alert Type (sms, email, or both).'),

        body('status')
            .optional()
            .custom(value => {
                const validValues = ['pending', 'completed'];
                if (validValues.includes(value)) return true;
                return false;

            })
            .withMessage('Status can either be pending or completed.')
    ];
}

function projectValidator() {
    return [
        body('title')
            .isLength({ min: 5, max: 20 })
            .withMessage('Title needs to be of 5 to 20 characters.'),

        body('description')
            .isLength({ min: 50, max: 200 })
            .withMessage('Please keep it within 50 to 200 characters.'),

        body('team')
            .optional()
            .isMongoId()
            .withMessage('Please provide a valid ObjectId.')
    ];
}

function teamValidator() {
    return [
        body("name")
            .isLength({ min: 5, max: 10 })
            .withMessage("Name can be of 5 to 10 letters only."),

        body('members')
            .isArray()
            .withMessage('Please provide an array.')
            .custom(value => {
                if (value.length == 0) return false;
                return true;
            })
            .withMessage("Choose some members, mate."),

        body('members.*')
            .isMongoId()
            .withMessage('Please provide a valid ObjectId.')
    ];
}

function memberValidator() {
    return [
        body('name')
            .isLength({ min: 4 })
            .withMessage('We need 4 letters in a name, at least.'),

        body('email')
            .isEmail()
            .withMessage('The address must be a valid email.'),

        body('phone')
            .isMobilePhone('en-IN', { strictMode: true })
            .withMessage('Why not type 10 digits only? No more no less.')
    ];
}

function alertsFilterValidator() {
    return [
        query('from')
            .custom(value => Boolean(Date.parse(value)))
            .withMessage('Enter a valid date'),

        query('to')
            .custom(value => Boolean(Date.parse(value)))
            .withMessage('Enter a valid date'),
    ];
}

function payAmountValidator() {
    return [
        body("amount")
            .isInt({ min: 100, max: 2000 })
            .withMessage("Invalid Amount"),

        body("currency")
            .custom((value) => {
                if (value != "INR") return false;
                return true;
            })
            .withMessage("We accept INR only.")
    ];
}

function validationMiddleware(req, res, next) {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        let errors = result.errors.reduce((acc, err) => {
            acc[err.path] = err.msg;
            return acc;
        }, {});

        return res.status(400).json({ validationErrors: errors });
    }
    return next();
}

export {
    signupValidator,
    loginValidator,
    profileDataValidator,
    taskValidator,
    projectValidator,
    alertsFilterValidator,
    teamValidator,
    memberValidator,
    payAmountValidator,
    validationMiddleware,
};