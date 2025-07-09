'use client';

import { useState } from 'react';
import { User, ChevronDown } from 'lucide-react';

export function TestUserSwitcher() {
  const [currentUser, setCurrentUser] = useState('demo-user');
  const [isOpen, setIsOpen] = useState(false);

  const testUsers = [
    { id: 'demo-user', name: 'Demo User', role: 'Admin' },
    { id: 'test-user-1', name: 'Test User 1', role: 'User' },
    { id: 'test-user-2', name: 'Test User 2', role: 'Manager' },
    { id: 'guest-user', name: 'Guest User', role: 'Guest' }
  ];

  const currentUserData = testUsers.find(user => user.id === currentUser);

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative">
        <button
          className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-md hover:bg-blue-600 flex items-center space-x-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <User className="w-4 h-4" />
          <span className="text-sm">{currentUserData?.name}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
        
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-xl">
            <div className="p-2">
              <div className="text-xs text-gray-500 mb-2">Switch Test User</div>
              {testUsers.map((user) => (
                <button
                  key={user.id}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                    currentUser === user.id ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                  onClick={() => {
                    setCurrentUser(user.id);
                    setIsOpen(false);
                    console.log(`Switched to test user: ${user.name}`);
                  }}
                >
                  <div className="font-medium text-sm">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.role}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 