export const
    users = `
        CREATE TABLE users (
            _id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone CHAR(13) NOT NULL,
            password CHAR(60) NOT NULL,
            is_email_verified BOOL DEFAULT false,
            is_phone_verified BOOL DEFAULT false,
            email_credits INT DEFAULT 150,
            sms_credits INT DEFAULT 50,
            alerts INT DEFAULT 0
        );
    `,
    tasks = `
        CREATE TABLE tasks (
            _id SERIAL PRIMARY KEY,
            user_id INT NOT NULL,
            task TEXT NOT NULL,
            status BOOL DEFAULT false,
            deadline TIMESTAMPTZ NOT NULL,
            reminders TIMESTAMPTZ [],
            alert_type VARCHAR(6) NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (_id)
            ON DELETE CASCADE
        );
    `