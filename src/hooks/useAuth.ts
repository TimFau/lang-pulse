import { useContext } from 'react';
import AuthContext from '../context/auth-context';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  // This is a simplified user object. In a real app, you'd have a more robust user type.
  const user = context.userId ? { id: context.userId, name: context.userName } : null;

  return { ...context, user };
}; 