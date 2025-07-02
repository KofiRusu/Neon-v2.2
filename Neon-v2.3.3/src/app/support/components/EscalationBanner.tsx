'use client';

import {
  ExclamationTriangleIcon,
  XMarkIcon,
  UserIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface EscalationBannerProps {
  onClose: () => void;
}

export default function EscalationBanner({ onClose }: EscalationBannerProps) {
  return (
    <div className="bg-orange-50 border-b border-orange-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <h4 className="font-medium text-orange-900">Escalated to Human Support</h4>
            <p className="text-sm text-orange-700">
              This conversation has been transferred to our human support team. Expected response
              time: 15-30 minutes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <UserIcon className="h-4 w-4" />
            <span>Agent: Sarah Thompson</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <ClockIcon className="h-4 w-4" />
            <span>ETA: 12 min</span>
          </div>
          <button onClick={onClose} className="p-1 text-orange-400 hover:text-orange-600 rounded">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <button className="px-3 py-1 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700">
          Notify Customer
        </button>
        <button className="px-3 py-1 border border-orange-300 text-orange-700 text-sm rounded-lg hover:border-orange-400">
          View Agent Notes
        </button>
      </div>
    </div>
  );
}
