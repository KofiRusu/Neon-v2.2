'use client';

import { useState } from 'react';
import { api } from '../../utils/trpc';
import {
  UserGroupIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  StarIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  BanknotesIcon,
  TrophyIcon,
  EyeIcon,
  PencilIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

export default function CustomersPage(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const customerSegments = [
    { id: 'all', name: 'All Customers', count: 1247, color: 'neon-blue' },
    { id: 'vip', name: 'VIP', count: 89, color: 'neon-gold' },
    { id: 'loyal', name: 'Loyal', count: 312, color: 'neon-green' },
    { id: 'new', name: 'New', count: 156, color: 'neon-purple' },
    { id: 'at-risk', name: 'At Risk', count: 43, color: 'neon-orange' },
  ];

  const customers = [
    {
      id: 1,
      name: 'Sarah Chen',
      email: 'sarah.chen@example.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      segment: 'vip',
      totalSpent: '$12,450',
      orders: 24,
      lastOrder: '2 days ago',
      lifetime: '18 months',
      avatar: 'SC',
      satisfaction: 4.9,
      status: 'active',
    },
    {
      id: 2,
      name: 'Marcus Johnson',
      email: 'marcus.j@example.com',
      phone: '+1 (555) 987-6543',
      location: 'New York, NY',
      segment: 'loyal',
      totalSpent: '$8,230',
      orders: 16,
      lastOrder: '1 week ago',
      lifetime: '14 months',
      avatar: 'MJ',
      satisfaction: 4.7,
      status: 'active',
    },
    {
      id: 3,
      name: 'Elena Rodriguez',
      email: 'elena.r@example.com',
      phone: '+1 (555) 456-7890',
      location: 'Austin, TX',
      segment: 'new',
      totalSpent: '$1,890',
      orders: 3,
      lastOrder: '3 days ago',
      lifetime: '2 months',
      avatar: 'ER',
      satisfaction: 4.5,
      status: 'active',
    },
    {
      id: 4,
      name: 'David Kim',
      email: 'david.kim@example.com',
      phone: '+1 (555) 321-0987',
      location: 'Seattle, WA',
      segment: 'at-risk',
      totalSpent: '$5,670',
      orders: 12,
      lastOrder: '3 weeks ago',
      lifetime: '8 months',
      avatar: 'DK',
      satisfaction: 3.8,
      status: 'inactive',
    },
    {
      id: 5,
      name: 'Priya Patel',
      email: 'priya.p@example.com',
      phone: '+1 (555) 654-3210',
      location: 'Los Angeles, CA',
      segment: 'vip',
      totalSpent: '$15,230',
      orders: 31,
      lastOrder: '1 day ago',
      lifetime: '22 months',
      avatar: 'PP',
      satisfaction: 5.0,
      status: 'active',
    },
    {
      id: 6,
      name: 'Ahmed Hassan',
      email: 'ahmed.h@example.com',
      phone: '+1 (555) 789-0123',
      location: 'Chicago, IL',
      segment: 'loyal',
      totalSpent: '$6,540',
      orders: 14,
      lastOrder: '4 days ago',
      lifetime: '11 months',
      avatar: 'AH',
      satisfaction: 4.6,
      status: 'active',
    },
  ];

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'vip':
        return 'text-neon-gold';
      case 'loyal':
        return 'text-neon-green';
      case 'new':
        return 'text-neon-purple';
      case 'at-risk':
        return 'text-neon-orange';
      default:
        return 'text-neon-blue';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'text-neon-green' : 'text-neon-orange';
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSegment = selectedSegment === 'all' || customer.segment === selectedSegment;
    return matchesSearch && matchesSegment;
  });

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Customer Intelligence</h1>
            <p className="text-secondary text-lg">
              360° customer insights and journey optimization
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="btn-neon">
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Add Customer
            </button>
            <button className="btn-neon-purple">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Analytics Report
            </button>
          </div>
        </div>
      </div>

      {/* Customer Segments */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {customerSegments.map(segment => (
          <button
            key={segment.id}
            onClick={() => setSelectedSegment(segment.id)}
            className={`card-neon transition-all duration-300 ${
              selectedSegment === segment.id ? 'scale-105 ring-2 ring-neon-blue' : ''
            }`}
          >
            <div className="text-center">
              <div className={`text-3xl font-bold text-${segment.color} mb-2`}>
                {segment.count.toLocaleString()}
              </div>
              <div className="text-primary font-medium">{segment.name}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="glass-strong p-6 rounded-2xl mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4 flex-1 max-w-lg">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary" />
              <input
                type="text"
                placeholder="Search customers by name or email..."
                className="input-neon pl-12 pr-4 py-3 w-full"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="glass p-3 rounded-xl text-secondary hover:text-neon-blue transition-colors">
              <FunnelIcon className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-neon-blue text-white'
                    : 'text-secondary hover:text-neon-blue'
                }`}
              >
                <UserGroupIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-neon-blue text-white'
                    : 'text-secondary hover:text-neon-blue'
                }`}
              >
                <ChartBarIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <div
            key={customer.id}
            className="card-neon group hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center text-white font-bold">
                  {customer.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-primary">{customer.name}</h3>
                  <p
                    className={`text-xs font-medium uppercase tracking-wide ${getSegmentColor(customer.segment)}`}
                  >
                    {customer.segment}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 glass rounded-lg text-secondary hover:text-neon-blue transition-colors">
                  <EyeIcon className="h-4 w-4" />
                </button>
                <button className="p-2 glass rounded-lg text-secondary hover:text-neon-purple transition-colors">
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-2 text-sm">
                <EnvelopeIcon className="h-4 w-4 text-secondary flex-shrink-0" />
                <span className="text-secondary truncate">{customer.email}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <MapPinIcon className="h-4 w-4 text-secondary flex-shrink-0" />
                <span className="text-secondary">{customer.location}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-secondary flex-shrink-0" />
                <span className="text-secondary">Customer for {customer.lifetime}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-neon-green">{customer.totalSpent}</div>
                <div className="text-xs text-secondary">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-neon-blue">{customer.orders}</div>
                <div className="text-xs text-secondary">Orders</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <StarIcon className="h-4 w-4 text-neon-gold fill-current" />
                <span className="text-sm font-medium text-primary">{customer.satisfaction}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${customer.status === 'active' ? 'bg-neon-green' : 'bg-neon-orange'} animate-pulse`}
                ></div>
                <span className={`text-xs font-medium ${getStatusColor(customer.status)}`}>
                  Last order: {customer.lastOrder}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <div className="text-center py-16">
          <UserGroupIcon className="h-16 w-16 text-neon-blue mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-primary mb-2">No customers found</h3>
          <p className="text-secondary">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
