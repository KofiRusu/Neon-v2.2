'use client';

import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

// Mock contacts data
const mockContacts = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1-555-0123',
    whatsapp: '+1-555-0123',
    lastContact: new Date('2024-01-16T09:07:00Z'),
    totalTickets: 3,
    status: 'active',
    tags: ['premium', 'restaurant'],
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@techstartup.com',
    phone: '+1-555-0124',
    whatsapp: null,
    lastContact: new Date('2024-01-16T08:45:00Z'),
    totalTickets: 1,
    status: 'active',
    tags: ['enterprise'],
  },
  {
    id: '3',
    name: 'Emma Wilson',
    email: 'emma@creativeco.com',
    phone: '+1-555-0125',
    whatsapp: '+1-555-0125',
    lastContact: new Date('2024-01-16T07:30:00Z'),
    totalTickets: 5,
    status: 'active',
    tags: ['agency', 'power-user'],
  },
];

export default function ContactPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'contacts' | 'sync'>('contacts');

  const filteredContacts = mockContacts.filter(
    contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery)
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('contacts')}
              className={`pb-2 border-b-2 font-medium ${
                activeTab === 'contacts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Contacts
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`pb-2 border-b-2 font-medium ${
                activeTab === 'sync'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              WhatsApp Sync
            </button>
          </div>

          {activeTab === 'contacts' && (
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <PlusIcon className="h-4 w-4" />
              Add Contact
            </button>
          )}
        </div>

        {activeTab === 'contacts' && (
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'contacts' ? (
          <div className="space-y-4">
            {filteredContacts.map(contact => (
              <div key={contact.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-600">
                        {contact.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{contact.name}</h3>

                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <EnvelopeIcon className="h-4 w-4" />
                          <span>{contact.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4" />
                          <span>{contact.phone}</span>
                        </div>
                        {contact.whatsapp && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <ChatBubbleLeftIcon className="h-4 w-4" />
                            <span>WhatsApp: {contact.whatsapp}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span>Last contact: {formatDate(contact.lastContact)}</span>
                        <span>{contact.totalTickets} tickets</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {contact.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <ChatBubbleLeftIcon className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Cog6ToothIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-2xl">
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">WhatsApp Integration</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">WhatsApp Business API</h4>
                    <p className="text-sm text-gray-600">Connect your WhatsApp Business account</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span className="text-sm text-red-600">Not connected</span>
                    <button className="ml-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Connect
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Auto-sync Messages</h4>
                    <p className="text-sm text-gray-600">
                      Automatically create tickets from WhatsApp messages
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">AI Auto-response</h4>
                    <p className="text-sm text-gray-600">Let AI handle common WhatsApp queries</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Response Templates</h3>

              <div className="space-y-3">
                <div className="p-3 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 text-sm">Welcome Message</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Hi! Thanks for contacting NeonHub support. How can I help you today?
                  </p>
                </div>

                <div className="p-3 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 text-sm">Escalation Notice</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    I'm connecting you with a human agent who can better assist you. Please hold
                    on...
                  </p>
                </div>

                <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400">
                  + Add New Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
