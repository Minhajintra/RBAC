/**
 * IntraShip UAM - Static Auth UI Copy & Content
 * Note: Pure UI content only. Zero mock datasets or backend entities.
 */

export interface StepItem {
  id: string;
  text: string;
}

export const brandingData = {
  appName: "IntraShip",
  appSubtitle: "USER & ACCESS MANAGEMENT",
  portalTag: "IntraShip • User & Access Management",
  headline: "Access your workspace.",
  subheadline: "Manage users, roles and permissions in one secure place.",
  steps: [
    { id: "01", text: "Sign in with your account" },
    { id: "02", text: "Verify identity when 2FA is enabled" },
    { id: "03", text: "Choose an authorized workspace" },
  ] as StepItem[],
  badgeText: "YOUR SECURE WORKSPACE",
  helpSupportText: "Help & support",
  copyright: "© 2026 IntraShip • User & Access Management",
};

export const loginData = {
  badge: "ACCOUNT ACCESS",
  title: "Welcome back",
  subtitle: "Sign in to continue to your workspace.",
  emailLabel: "Email or username",
  emailPlaceholder: "Enter your email or username",
  passwordLabel: "Password",
  passwordPlaceholder: "Enter your password",
  rememberMe: "Remember me",
  forgotPasswordLink: "Forgot password?",
  submitButton: "Sign in",
  loadingButton: "Signing in...",
  supportTroubleText: "Having trouble accessing your account?",
  supportContactText: "Contact your administrator",
  securityNote: "Protected sign-in for your organization",
  validation: {
    requiredEmail: "Enter your email or username to continue.",
    requiredPassword: "Enter your password to continue.",
    invalidCredentials:
      "The email/username or password you entered is incorrect.",
  },
};

export const forgotPasswordData = {
  badge: "ACCOUNT RECOVERY",
  title: "Forgot your password?",
  subtitle:
    "No worries. Enter your registered email and we'll send you a secure verification code.",
  emailLabel: "Registered email",
  emailPlaceholder: "name@example.com",
  submitButton: "Send verification code",
  loadingButton: "Sending code...",
  backToLogin: "Back to sign in",
  footerNote: "Your account stays protected throughout the recovery process.",
  validation: {
    requiredEmail: "Registered email is required.",
    invalidFormat: "Check the email address format (e.g. name@example.com).",
  },
  confirmation: {
    title: "Verification code sent!",
    message:
      "If an account matches your email address, you will receive a secure 6-digit verification code shortly. Please check your inbox and spam folder.",
  },
  sidePanel: {
    tag: "ACCOUNT RECOVERY",
    title: "A secure way back in",
    subtitle: "Verify your identity before resetting your password.",
    items: [
      { id: "01", text: "Verification sent to your registered email" },
      { id: "02", text: "One-time code protects your account" },
      { id: "03", text: "Create a new, strong password" },
    ] as StepItem[],
    footer: "INTRASHIP • SECURE BY DESIGN",
  },
};
