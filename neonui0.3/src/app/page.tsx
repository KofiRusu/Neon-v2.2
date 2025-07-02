"use client";

import { api } from "@/utils/trpc";

export default function HomePage() {
  // Test tRPC health check hook
  const {
    data: healthData,
    isLoading: healthLoading,
    error: healthError,
  } = api.health.ping.useQuery();

  // Test tRPC user profile hook
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = api.user.getProfile.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🚀 NeonHub - tRPC Integration Test
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Health Check Test */}
          <div className="bg-slate-800 p-6 rounded-lg border border-purple-500">
            <h2 className="text-xl font-semibold mb-4 text-purple-300">
              🏥 Health Check API
            </h2>
            {healthLoading && <p className="text-yellow-300">Loading...</p>}
            {healthError && (
              <p className="text-red-300">Error: {healthError.message}</p>
            )}
            {healthData && (
              <div className="text-green-300">
                <p>✅ Status: {healthData.message}</p>
                <p>🕐 Time: {healthData.timestamp}</p>
              </div>
            )}
          </div>

          {/* User Profile Test */}
          <div className="bg-slate-800 p-6 rounded-lg border border-purple-500">
            <h2 className="text-xl font-semibold mb-4 text-purple-300">
              👤 User Profile API
            </h2>
            {userLoading && <p className="text-yellow-300">Loading...</p>}
            {userError && (
              <p className="text-red-300">Error: {userError.message}</p>
            )}
            {userData && (
              <div className="text-green-300">
                <p>✅ Name: {userData.name}</p>
                <p>📧 Email: {userData.email}</p>
                <p>🔐 Role: {userData.role}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-lg text-purple-200">
            🎯 tRPC + React Query Integration Status
          </p>
          <div className="mt-4 space-x-4">
            <span
              className={`px-3 py-1 rounded ${healthData ? "bg-green-600" : "bg-gray-600"}`}
            >
              Health API: {healthData ? "✅" : "⏳"}
            </span>
            <span
              className={`px-3 py-1 rounded ${userData ? "bg-green-600" : "bg-gray-600"}`}
            >
              User API: {userData ? "✅" : "⏳"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
