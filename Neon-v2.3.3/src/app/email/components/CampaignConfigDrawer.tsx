'use client';

interface EmailData {
  // Define proper type structure for email data
  [key: string]: unknown;
}

interface CampaignConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  emailData: EmailData;
  onUpdate: (data: EmailData) => void;
}

export default function CampaignConfigDrawer({
  isOpen,
  onClose,
  emailData: _emailData,
  onUpdate: _onUpdate,
}: CampaignConfigDrawerProps): JSX.Element | null {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Configuration</h3>
          <button onClick={onClose} className="text-gray-500">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
