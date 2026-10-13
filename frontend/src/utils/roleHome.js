export function roleHomePath(role) {
  if (role === 'admin') return '/admin';
  if (role === 'agent') return '/agent';
  return '/app';
}
