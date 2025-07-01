'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { faq } from '@/lib/faq';

interface FaqAccordionProps {
  selectedCategory?: string;
  searchTerm?: string;
}

export function FaqAccordion({ selectedCategory, searchTerm }: FaqAccordionProps) {
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  const toggleQuestion = (questionId: string) => {
    const newOpenQuestions = new Set(openQuestions);
    if (newOpenQuestions.has(questionId)) {
      newOpenQuestions.delete(questionId);
    } else {
      newOpenQuestions.add(questionId);
    }
    setOpenQuestions(newOpenQuestions);
  };

  // Filter questions based on category and search term
  const getFilteredQuestions = () => {
    let questions = faq.categories.flatMap(category =>
      category.questions.map(q => ({
        ...q,
        categoryName: category.name,
        categoryIcon: category.icon,
      }))
    );

    if (selectedCategory && selectedCategory !== 'all') {
      questions = questions.filter(q => q.category === selectedCategory);
    }

    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      questions = questions.filter(
        q =>
          q.question.toLowerCase().includes(lowercaseSearch) ||
          q.answer.toLowerCase().includes(lowercaseSearch) ||
          q.tags.some(tag => tag.toLowerCase().includes(lowercaseSearch))
      );
    }

    return questions;
  };

  const filteredQuestions = getFilteredQuestions();

  const handleHelpful = (questionId: string, helpful: boolean) => {
    // In a real app, this would call an API to record the feedback
    console.log(`Question ${questionId} marked as ${helpful ? 'helpful' : 'not helpful'}`);
  };

  return (
    <div className="space-y-4">
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-50">🤷‍♂️</div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No matching questions found</h3>
          <p className="text-gray-500">Try adjusting your search or browse different categories</p>
        </div>
      ) : (
        filteredQuestions.map(question => (
          <div
            key={question.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Question Header */}
            <button
              onClick={() => toggleQuestion(question.id)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1">
                <span className="text-xl">{question.categoryIcon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 pr-4">{question.question}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">{question.categoryName}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      Updated {question.lastUpdated.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {openQuestions.has(question.id) ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
              )}
            </button>

            {/* Answer Content */}
            {openQuestions.has(question.id) && (
              <div className="px-6 pb-6">
                <div className="border-t border-gray-100 pt-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed">{question.answer}</p>
                  </div>

                  {/* Tags */}
                  {question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {question.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Feedback Section */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">Was this helpful?</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleHelpful(question.id, true)}
                          className="flex items-center space-x-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-full transition-colors"
                        >
                          <span>👍</span>
                          <span>{question.helpful}</span>
                        </button>
                        <button
                          onClick={() => handleHelpful(question.id, false)}
                          className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <span>👎</span>
                          <span>{question.notHelpful}</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      {Math.round(
                        (question.helpful / (question.helpful + question.notHelpful)) * 100
                      )}
                      % found helpful
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// Category selector component
export function FaqCategorySelector({
  selectedCategory,
  onCategoryChange,
}: {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <button
        onClick={() => onCategoryChange('all')}
        className={`p-4 rounded-lg border-2 transition-all ${
          selectedCategory === 'all'
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="text-2xl mb-2">🌟</div>
        <div className="text-sm font-medium">All Topics</div>
      </button>

      {faq.categories.map(category => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`p-4 rounded-lg border-2 transition-all ${
            selectedCategory === category.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-2xl mb-2">{category.icon}</div>
          <div className="text-sm font-medium">{category.name}</div>
          <div className="text-xs text-gray-500 mt-1">{category.questions.length} questions</div>
        </button>
      ))}
    </div>
  );
}

// Quick help topics component
export function QuickHelpTopics() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Quick Start Guide</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {faq.quickHelp.map((topic, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="text-2xl mb-2">{topic.icon}</div>
            <h4 className="font-semibold text-gray-900 mb-1">{topic.title}</h4>
            <p className="text-sm text-gray-600 mb-3">{topic.description}</p>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              {topic.action} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Support contact info component
export function SupportContactInfo() {
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📞 Need More Help?</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl mb-2">💬</div>
          <div className="font-medium text-gray-900">Live Chat</div>
          <div className="text-sm text-gray-600">{faq.supportContact.liveChatHours}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-2">📧</div>
          <div className="font-medium text-gray-900">Email Support</div>
          <div className="text-sm text-blue-600 hover:text-blue-700">
            <a href={`mailto:${faq.supportContact.email}`}>{faq.supportContact.email}</a>
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-2">📞</div>
          <div className="font-medium text-gray-900">Phone Support</div>
          <div className="text-sm text-gray-600">{faq.supportContact.phone}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-2">⚡</div>
          <div className="font-medium text-gray-900">Response Time</div>
          <div className="text-sm text-gray-600">{faq.supportContact.averageResponseTime}</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <span>⭐</span>
            <span>{faq.supportContact.satisfactionScore}/5.0 satisfaction</span>
          </div>
          <span>•</span>
          <div>Available in {faq.supportContact.languages.join(', ')}</div>
        </div>
      </div>
    </div>
  );
}
