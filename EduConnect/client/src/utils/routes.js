/** Landing page for a user after login, based on their role. */
export const homeFor = (user) => (user?.role === 'admin' ? '/admin' : '/dashboard');
