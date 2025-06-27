'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import {
  FaqAccordion,
  FaqCategorySelector,
  QuickHelpTopics,
  SupportContactInfo,
} from '@/components/FaqAccordion';
import { faq } from '@/lib/faq';

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">📚 Frequently Asked Questions</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get instant answers to common questions about NeonHub's AI marketing platform. Can't
              find what you're looking for? Our support team is here to help.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-8">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions, keywords, or topics..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {faq.categories.reduce((sum, cat) => sum + cat.questions.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{faq.categories.length}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {faq.supportContact.satisfactionScore}/5.0
              </div>
              <div className="text-sm text-gray-600">Support Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {faq.supportContact.averageResponseTime}
              </div>
              <div className="text-sm text-gray-600">Response Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Start Guide */}
        <QuickHelpTopics />

        {/* Category Selector */}
        <FaqCategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Search Results Info */}
        {searchTerm && (
          <div className="mb-6">
            <p className="text-gray-600">
              {searchTerm ? (
                <>
                  Showing results for "<strong>{searchTerm}</strong>"
                  {selectedCategory !== 'all' && (
                    <>
                      {' '}
                      in{' '}
                      <strong>{faq.categories.find(c => c.id === selectedCategory)?.name}</strong>
                    </>
                  )}
                </>
              ) : (
                selectedCategory !== 'all' && (
                  <>
                    Showing all questions in{' '}
                    <strong>{faq.categories.find(c => c.id === selectedCategory)?.name}</strong>
                  </>
                )
              )}
            </p>
          </div>
        )}

        {/* FAQ Accordion */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <FaqAccordion selectedCategory={selectedCategory} searchTerm={searchTerm} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Questions */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 Most Popular</h3>
              <div className="space-y-3">
                {faq.categories
                  .flatMap(cat => cat.questions)
                  .sort(
                    (a, b) =>
                      b.helpful / (b.helpful + b.notHelpful) -
                      a.helpful / (a.helpful + a.notHelpful)
                  )
                  .slice(0, 5)
                  .map(question => (
                    <div key={question.id} className="text-sm">
                      <button
                        onClick={() => {
                          setSelectedCategory(question.category);
                          setSearchTerm('');
                        }}
                        className="text-blue-600 hover:text-blue-700 text-left"
                      >
                        {question.question}
                      </button>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(
                          (question.helpful / (question.helpful + question.notHelpful)) * 100
                        )}
                        % helpful
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Feature Requests */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Feature Requests</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Most Requested</h4>
                  <ul className="space-y-1">
                    {faq.featureRequests.popular.slice(0, 3).map((request, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 flex-shrink-0"></span>
                        {request}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">In Development</h4>
                  <ul className="space-y-1">
                    {faq.featureRequests.inDevelopment.slice(0, 2).map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2 flex-shrink-0"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Quick Fixes</h3>
              <div className="space-y-3">
                {faq.troubleshooting.map((issue, index) => (
                  <div key={index} className="border-l-4 border-orange-400 pl-3">
                    <div className="text-sm font-medium text-gray-900">{issue.issue}</div>
                    <div className="text-xs text-gray-600 mt-1">{issue.solution}</div>
                    <div className="text-xs text-orange-600 mt-1">~{issue.estimatedTime}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Support Section */}
        <div className="mt-12">
          <SupportContactInfo />
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Still need help? We're here for you!
          </h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Our expert support team is available 24/7 to help you get the most out of NeonHub's AI
            marketing platform. Get personalized assistance within minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              💬 Start Live Chat
            </button>
            <button className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors">
              📧 Send Email
            </button>
            <button className="bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-800 transition-colors">
              📞 Schedule Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
