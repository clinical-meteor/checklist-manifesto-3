# Authentication Setup for Checklist Manifesto

This guide explains how to integrate Meteor's built-in authentication system with your Checklist Manifesto application.

## Overview

We're using Meteor's native accounts-password system, which provides:
- User authentication (login/logout)
- User registration
- Password reset functionality
- Session management

## Setup Instructions

### 1. Install Required Packages

Run the provided script to install necessary Meteor packages:

```bash
chmod +x setup-auth.sh
./setup-auth.sh
```

Or manually add the packages:

```bash
meteor add accounts-password
meteor add accounts-base
meteor add email
meteor add check
```

### 2. File Integration

Copy the following files to your project:

1. **Server Setup**: 
   - `imports/startup/server/accounts-setup.js` → Configure server-side authentication

2. **Server Integration**:
   - Update `server/main.js` with the simplified version to integrate with the accounts system

3. **Client Components**:
   - `imports/ui/LoginForm.jsx` → Form with login, registration, and password reset
   - `imports/ui/App.jsx` → Main app with authentication checks

### 3. Email Configuration (Optional)

To enable password reset emails, add email configuration to your settings:

```js
// In your settings.js or settings.json
{
  "mail": {
    "enabled": true,
    "from": "noreply@example.com"
  }
}
```

Add the email package if you want to send emails:

```bash
meteor add email
```

## Usage

### Authentication API

The authentication system provides these main functions:

```js
// Login
Meteor.loginWithPassword({ username: 'admin' }, 'password', callback);
// OR
Meteor.loginWithPassword({ email: 'user@example.com' }, 'password', callback);

// Register
Accounts.createUser({
  username: 'username',
  email: 'email@example.com',
  password: 'password',
  profile: {}
}, callback);

// Logout
Meteor.logout(callback);

// Reset Password
Accounts.forgotPassword({ email: 'user@example.com' }, callback);
```

### Getting Current User

In any component, you can access the current user with:

```js
// In React component
import { useTracker } from 'meteor/react-meteor-data';

const { user, isLoading } = useTracker(() => {
  const userSub = Meteor.subscribe('userData');
  return {
    isLoading: !userSub.ready(),
    user: Meteor.user()
  };
});
```

## Troubleshooting

- **Login not working**: Check if the admin user was successfully created at startup
- **Session issues**: Make sure you're subscribed to the `userData` publication
- **Password reset emails not sending**: Check your email configuration

## Security Considerations

1. Always use HTTPS in production
2. Consider adding rate limiting for login attempts
3. Use environment variables for sensitive information (e.g., email SMTP settings)
4. Add access control to publications and methods

## Additional Resources

- [Meteor Accounts Documentation](https://docs.meteor.com/api/accounts.html)
- [Meteor Guide: Accounts](https://guide.meteor.com/accounts.html)