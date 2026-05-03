export interface TestUser {
  username: string;
  email: string;
  password: string;
  displayName: string;
  bio?: string;
}

export const testUsers = {
  standard: {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'TestPass123!',
    displayName: 'Test User',
  },
  admin: {
    username: 'admin',
    email: 'admin@example.com',
    password: 'AdminPass123!',
    displayName: 'Admin',
  },
  otherUser: {
    username: 'otheruser',
    email: 'other@example.com',
    password: 'OtherPass123!',
    displayName: 'Other User',
  },
} as const satisfies Record<string, TestUser>;

export const invalidUsers = {
  shortUsername: { username: 'ab', email: 'short@example.com', password: 'ValidPass123!', displayName: 'Short' },
  longUsername: { username: 'a'.repeat(51), email: 'long@example.com', password: 'ValidPass123!', displayName: 'Long' },
  xssUsername: { username: '<script>alert(1)</script>', email: 'xss@example.com', password: 'ValidPass123!', displayName: 'XSS' },
  invalidEmail: { username: 'invalidmail', email: 'not-an-email', password: 'ValidPass123!', displayName: 'Invalid' },
  weakPassword: { username: 'weakpw', email: 'weak@example.com', password: 'weakpassword', displayName: 'Weak' },
  shortPassword: { username: 'shortpw', email: 'shortpw@example.com', password: 'Ab1', displayName: 'ShortPW' },
  emptyFields: { username: '', email: '', password: '', displayName: '' },
} as const;
