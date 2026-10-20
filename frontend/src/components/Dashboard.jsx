import { useAuth } from '../services/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    console.log('User logged out');
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Welcome, {user?.name || 'User'}</h2>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition duration-200"
        >
          Logout
        </button>
      </div>

      <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">User Information</h3>
        <div className="space-y-3">
          <p className="text-gray-700"><span className="font-medium">Name:</span> {user?.name}</p>
          <p className="text-gray-700"><span className="font-medium">Email:</span> {user?.email}</p>
          <p className="text-gray-700">
            <span className="font-medium">Role:</span> 
            <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
              user?.role === 'employer' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {user?.role}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;