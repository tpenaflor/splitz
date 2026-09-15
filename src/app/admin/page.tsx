import AdminDashboard from './AdminDashboard';

export const metadata = {
  title: 'Admin Dashboard | Splitz',
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-8 py-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Splitz Admin</h1>
      </header>
      <main className="p-8">
        <AdminDashboard />
      </main>
    </div>
  );
}
