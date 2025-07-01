'use client';

import { useState } from 'react';

interface PlatformCredential {
  id: string;
  name: string;
  connected: boolean;
  accountName?: string;
  lastSync?: string;
  color: string;
}

export function CredentialStatusBar(): JSX.Element {
  const [credentials, setCredentials] = useState<PlatformCredential[]>([
    {
      id: 'instagram',
      name: 'Instagram',
      connected: true,
      accountName: '@neonhub_official',
      lastSync: '2 hours ago',
      color: 'pink',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      connected: true,
      accountName: '@neonhub',
      lastSync: '1 hour ago',
      color: 'blue',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      connected: false,
      color: 'blue',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      connected: true,
      accountName: 'NeonHub',
      lastSync: '3 hours ago',
      color: 'blue',
    },
  ]);

  const handleConnect = (platformId: string): void => {
    // In a real app, this would trigger OAuth flow
    // TODO: Implement OAuth flow for platform connection

    // Mock connection
    setCredentials(prev =>
      prev.map(cred =>
        cred.id === platformId
          ? { ...cred, connected: true, accountName: `Mock Account`, lastSync: 'Just now' }
          : cred
      )
    );
  };

  const handleDisconnect = (platformId: string): void => {
    setCredentials(prev =>
      prev.map(cred =>
        cred.id === platformId
          ? { ...cred, connected: false, accountName: undefined, lastSync: undefined }
          : cred
      )
    );
  };

  const connectedCount = credentials.filter(c => c.connected).length;

  return (
    <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-neutral-200">Platform Connections</h3>
        <div className="text-sm text-neutral-400">
          {connectedCount}/{credentials.length} connected
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {credentials.map(credential => (
          <div
            key={credential.id}
            className={`p-3 rounded-lg border transition-all ${
              credential.connected
                ? 'bg-green-900/20 border-green-600/30'
                : 'bg-neutral-800 border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white text-sm">{credential.name}</span>
              <div
                className={`w-2 h-2 rounded-full ${
                  credential.connected ? 'bg-green-400' : 'bg-red-400'
                }`}
              />
            </div>

            {credential.connected ? (
              <div className="space-y-1">
                <p className="text-xs text-neutral-300">{credential.accountName}</p>
                <p className="text-xs text-neutral-500">Last sync: {credential.lastSync}</p>
                <button
                  onClick={() => handleDisconnect(credential.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-neutral-500">Not connected</p>
                <button
                  onClick={() => handleConnect(credential.id)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    credential.color === 'pink'
                      ? 'bg-pink-600 hover:bg-pink-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Connect
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-400">Quick Actions</div>
          <div className="flex space-x-2">
            <button className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
              Sync All
            </button>
            <button className="text-xs px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors">
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
