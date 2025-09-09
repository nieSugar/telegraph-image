import type { NextPage } from 'next';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminPage from './AdminPage';

const Admin: NextPage = () => {
  return (
    <ProtectedRoute>
      <AdminPage />
    </ProtectedRoute>
  );
};

export default Admin;
