'use client';

import { useState, useEffect } from 'react';
import { brand } from '@/lib/brand';

interface VoiceGuidelinesPanelProps {
  profileId?: string;
}

export function VoiceGuidelinesPanel({ profileId }: VoiceGuidelinesPanelProps) {
  const [guidelines, setGuidelines] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Real brand guidelines from brand configuration
  const realGuidelines = {
    tone: {
      primary: brand.voice.primary,
      secondary: brand.voice.secondary,
      avoid: brand.guidelines.tone.avoid,
    },
    vocabulary: {
      preferred: brand.vocabulary.preferred,
      prohibited: brand.vocabulary.prohibited,
      brandTerms: brand.vocabulary.brandTerms,
    },
    style: {
      sentenceLength: brand.guidelines.style.sentenceLength,
      paragraphLength: 'short-to-medium',
      readingLevel: brand.guidelines.style.readingLevel,
      punctuation: brand.guidelines.style.punctuation,
    },
    messaging: {
      valueProposition: brand.messaging.primaryValue,
      keyMessages: brand.messaging.keyMessages.slice(0, 3), // Take first 3 key messages
    },
  };

  useEffect(() => {
    const loadGuidelines = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setGuidelines(realGuidelines);
      } catch (error) {
        console.error('Failed to load guidelines:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGuidelines();
  }, [profileId]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading guidelines...</p>
      </div>
    );
  }

  if (!guidelines) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No guidelines available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-2">Brand Voice Guidelines</h3>
        <p className="text-gray-600">
          Reference guide for maintaining consistent brand voice across all content
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tone Guidelines */}
        <div className="p-6 border rounded-lg">
          <h4 className="text-md font-semibold mb-4 text-blue-700">Tone Guidelines</h4>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-sm">Primary Tone:</span>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm capitalize">
                {guidelines.tone.primary}
              </span>
            </div>
            <div>
              <span className="font-medium text-sm">Secondary Tone:</span>
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-sm capitalize">
                {guidelines.tone.secondary}
              </span>
            </div>
            <div>
              <span className="font-medium text-sm block mb-2">Avoid:</span>
              <div className="flex flex-wrap gap-1">
                {guidelines.tone.avoid.map((item: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Vocabulary Guidelines */}
        <div className="p-6 border rounded-lg">
          <h4 className="text-md font-semibold mb-4 text-green-700">Vocabulary Guidelines</h4>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-sm block mb-2">Preferred Words:</span>
              <div className="flex flex-wrap gap-1">
                {guidelines.vocabulary.preferred.map((word: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="font-medium text-sm block mb-2">Prohibited Words:</span>
              <div className="flex flex-wrap gap-1">
                {guidelines.vocabulary.prohibited.map((word: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                    {word}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="font-medium text-sm block mb-2">Brand Terms:</span>
              <div className="flex flex-wrap gap-1">
                {guidelines.vocabulary.brandTerms.map((term: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                    {term}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Style Guidelines */}
        <div className="p-6 border rounded-lg">
          <h4 className="text-md font-semibold mb-4 text-purple-700">Style Guidelines</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Sentence Length:</span>
                <span className="ml-2 capitalize">{guidelines.style.sentenceLength}</span>
              </div>
              <div>
                <span className="font-medium">Paragraph Length:</span>
                <span className="ml-2 capitalize">{guidelines.style.paragraphLength}</span>
              </div>
              <div>
                <span className="font-medium">Reading Level:</span>
                <span className="ml-2 capitalize">{guidelines.style.readingLevel}</span>
              </div>
              <div>
                <span className="font-medium">Punctuation:</span>
                <span className="ml-2 capitalize">{guidelines.style.punctuation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messaging Guidelines */}
        <div className="p-6 border rounded-lg">
          <h4 className="text-md font-semibold mb-4 text-orange-700">Messaging Guidelines</h4>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-sm block mb-2">Value Proposition:</span>
              <p className="text-sm italic p-3 bg-orange-50 rounded">
                "{guidelines.messaging.valueProposition}"
              </p>
            </div>
            <div>
              <span className="font-medium text-sm block mb-2">Key Messages:</span>
              <ul className="space-y-1">
                {guidelines.messaging.keyMessages.map((message: string, index: number) => (
                  <li key={index} className="text-sm flex items-start">
                    <span className="text-orange-600 mr-2">•</span>
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button className="px-4 py-2 border rounded-md hover:bg-gray-50">Export Guidelines</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Edit Guidelines
        </button>
      </div>
    </div>
  );
}
