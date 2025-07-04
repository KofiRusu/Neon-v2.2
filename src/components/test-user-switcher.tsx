'use client';

import { useState } from 'react';
import { Users, ChevronDown, Check, Crown, User } from 'lucide-react';

interface TestUser {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

const testUsers: TestUser[] = [
  { id: 'admin', name: 'Admin Test', role: 'Administrator', avatar: '👑' },
  { id: 'marketer', name: 'Marketing Manager', role: 'Marketing Manager', avatar: '📊' },
  { id: 'basic', name: 'Basic User', role: 'Basic User', avatar: '👤' },
];

export function TestUserSwitcher() {
  const [currentUser, setCurrentUser] = useState<TestUser>(testUsers[0]);
  const [isOpen, setIsOpen] = useState(false);
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT;

  // Only show in staging environment
  if (environment !== 'staging') return null;

  const handleUserSwitch = (user: TestUser) => {
    setCurrentUser(user);
    setIsOpen(false);
    localStorage.setItem('qa_test_user', JSON.stringify(user));
    console.log('QA: Switched to test user:', user);
  };

  return (
    <div className="fixed top-16 right-4 z-40">
      <div className="bg-slate-800/95 backdrop-blur border border-slate-700 rounded-lg shadow-lg">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-3 px-4 py-3 text-sm text-white hover:bg-slate-700/50 rounded-lg w-full"
        >
          <Users className="h-4 w-4 text-amber-400" />
          <span className="text-amber-400 font-medium">QA USER:</span>
          <span className="text-2xl">{currentUser.avatar}</span>
          <div className="text-left">
            <div className="font-medium">{currentUser.name}</div>
            <div className="text-xs text-gray-400">{currentUser.role}</div>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="border-t border-slate-700 py-2">
            {testUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSwitch(user)}
                className="flex items-center space-x-3 px-4 py-2 text-sm text-white hover:bg-slate-700/50 w-full"
              >
                <span className="text-lg">{user.avatar}</span>
                <div className="text-left flex-1">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-gray-400">{user.role}</div>
                </div>
                {currentUser.id === user.id && <Check className="h-4 w-4 text-green-400" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 