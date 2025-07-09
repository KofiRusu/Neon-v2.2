"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface PersonalizationEngineProps {
  userId?: string;
  sessionId?: string;
  children: React.ReactNode;
}

interface UserSegment {
  id: string;
  name: string;
  description?: string;
  criteria: Record<string, unknown>;
  size: number;
  isActive: boolean;
  behaviorTriggers: BehaviorTrigger[];
}

interface UserPersona {
  id: string;
  segmentId: string;
  name: string;
  description?: string;
  demographics?: Record<string, unknown>;
  behaviorTraits?: Record<string, unknown>;
  painPoints: string[];
  goals: string[];
  preferredTone: string;
  contentPreferences?: Record<string, unknown>;
}

interface BehaviorTrigger {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  conditions: Record<string, unknown>;
  action: Record<string, unknown>;
  priority: number;
  isActive: boolean;
}

interface PersonalizationRule {
  id: string;
  name: string;
  description?: string;
  ruleType: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  priority: number;
  isActive: boolean;
}

interface PersonalizationState {
  userSegment?: UserSegment;
  activePersona?: UserPersona;
  activeTriggers: Array<{ trigger: BehaviorTrigger; result: TriggerResult }>;
  appliedRules: Array<{ rule: PersonalizationRule; result: PersonalizationResult }>;
  behaviorData: Record<string, unknown>;
  isLoading: boolean;
}

interface BehaviorEvent {
  eventType: string;
  eventData?: Record<string, unknown>;
  timestamp?: Date;
}

interface TriggerResult {
  triggered: boolean;
  trigger?: string;
  action?: unknown;
}

interface PersonalizationResult {
  type: string;
  changes: Record<string, unknown>;
  applied: boolean;
}

interface PersonalizationContext {
  state: PersonalizationState;
  logBehaviorEvent: (event: BehaviorEvent) => Promise<void>;
  appliedRules: Array<{ rule: PersonalizationRule; result: PersonalizationResult }>;
  activeTriggers: Array<{ trigger: BehaviorTrigger; result: TriggerResult }>;
  isPersonalized: boolean;
}

export const PersonalizationEngine: React.FC<PersonalizationEngineProps> = ({
  userId,
  sessionId,
  children
}) => {
  const pathname = usePathname();
  const [state, setState] = useState<PersonalizationState>({
    activeTriggers: [],
    appliedRules: [],
    behaviorData: {},
    isLoading: true
  });

  // Mock data for now since backend isn't ready
  const mockUserSegments: UserSegment[] = [
    {
      id: '1',
      name: 'Enterprise',
      description: 'Large business customers',
      criteria: { company_size: 'large' },
      size: 100,
      isActive: true,
      behaviorTriggers: []
    }
  ];

  const mockPersonalizationRules: PersonalizationRule[] = [
    {
      id: '1',
      name: 'Content Personalization',
      description: 'Personalize content based on user segment',
      ruleType: 'CONTENT',
      conditions: { segment: 'enterprise' },
      actions: { showContent: ['enterprise-features'] },
      priority: 1,
      isActive: true
    }
  ];

  // Log behavior event
  const logBehaviorEvent = useCallback(async (event: BehaviorEvent) => {
    try {
      // Mock implementation - in real app this would call tRPC
      console.log('Logging behavior event:', event);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Failed to log behavior event:', error);
    }
  }, [userId, sessionId, pathname]);

  // Process behavior triggers
  const processBehaviorTriggers = useCallback(async (eventType: string, eventData: Record<string, unknown>) => {
    // Mock implementation
    console.log('Processing behavior triggers:', eventType, eventData);
    
    // Simulate finding and processing triggers
    const mockTriggers = mockUserSegments.flatMap(segment => 
      segment.behaviorTriggers.filter(trigger => 
        trigger.triggerType.toLowerCase() === eventType.toLowerCase() && trigger.isActive
      )
    );

    for (const trigger of mockTriggers) {
      try {
        // Mock trigger result
        const result: TriggerResult = {
          triggered: true,
          trigger: trigger.name,
          action: trigger.action
        };

        setState(prev => ({
          ...prev,
          activeTriggers: [...prev.activeTriggers, { trigger, result }]
        }));

        // Apply personalization based on trigger result
        await applyPersonalization(trigger, result);
      } catch (error) {
        console.error('Failed to process behavior trigger:', error);
      }
    }
  }, []);

  // Apply personalization rules
  const applyPersonalization = useCallback(async (trigger: BehaviorTrigger, triggerResult: TriggerResult) => {
    const applicableRules = mockPersonalizationRules.filter(rule =>
      rule.conditions.triggerType === trigger.triggerType ||
      rule.conditions.segmentId === trigger.id
    );

    for (const rule of applicableRules) {
      try {
        // Apply the personalization rule
        const personalizedContent = await executePersonalizationRule(rule, triggerResult);
        
        setState(prev => ({
          ...prev,
          appliedRules: [...prev.appliedRules, { rule, result: personalizedContent }]
        }));

        // Trigger UI updates based on the rule
        triggerUIUpdate(rule, personalizedContent);
      } catch (error) {
        console.error('Failed to apply personalization rule:', error);
      }
    }
  }, []);

  // Execute personalization rule
  const executePersonalizationRule = async (rule: PersonalizationRule, triggerResult: TriggerResult): Promise<PersonalizationResult> => {
    const { ruleType, actions } = rule;

    switch (ruleType) {
      case 'CONTENT':
        return await personalizeContent(actions, triggerResult);
      case 'TONE':
        return await personalizeTone(actions, triggerResult);
      case 'LAYOUT':
        return await personalizeLayout(actions, triggerResult);
      case 'MESSAGING':
        return await personalizeMessaging(actions, triggerResult);
      default:
        return { type: ruleType, changes: {}, applied: false };
    }
  };

  // Personalization implementations
  const personalizeContent = async (actions: Record<string, unknown>, triggerResult: TriggerResult): Promise<PersonalizationResult> => {
    // Mock implementation
    return {
      type: 'content',
      changes: {
        recommendedContent: [],
        hiddenContent: [],
        promotedContent: []
      },
      applied: true
    };
  };

  const personalizeTone = async (actions: Record<string, unknown>, triggerResult: TriggerResult): Promise<PersonalizationResult> => {
    // Mock implementation
    return {
      type: 'tone',
      changes: {
        targetTone: actions.targetTone || 'friendly',
        fallbackTone: actions.fallbackTone || 'professional',
        segmentSpecific: actions.segmentSpecific || false
      },
      applied: true
    };
  };

  const personalizeLayout = async (actions: Record<string, unknown>, triggerResult: TriggerResult): Promise<PersonalizationResult> => {
    // Mock implementation
    return {
      type: 'layout',
      changes: {
        layoutVariant: actions.layoutVariant || 'default',
        hideElements: actions.hideElements || [],
        showElements: actions.showElements || [],
        reorderElements: actions.reorderElements || {}
      },
      applied: true
    };
  };

  const personalizeMessaging = async (actions: Record<string, unknown>, triggerResult: TriggerResult): Promise<PersonalizationResult> => {
    // Mock implementation
    return {
      type: 'messaging',
      changes: {
        primaryMessage: actions.primaryMessage,
        secondaryMessage: actions.secondaryMessage,
        ctaText: actions.ctaText,
        urgencyLevel: actions.urgencyLevel || 'normal'
      },
      applied: true
    };
  };

  // Trigger UI updates
  const triggerUIUpdate = (rule: PersonalizationRule, personalizedContent: PersonalizationResult) => {
    // Dispatch custom events for UI components to listen to
    const event = new CustomEvent('personalizationUpdate', {
      detail: {
        rule,
        personalizedContent,
        timestamp: new Date()
      }
    });
    window.dispatchEvent(event);
  };

  // Track page view
  useEffect(() => {
    const trackPageView = async () => {
      await logBehaviorEvent({
        eventType: 'page_view',
        eventData: { 
          pathname,
          referrer: document.referrer,
          timestamp: new Date()
        }
      });

      // Process potential page visit triggers
      await processBehaviorTriggers('page_visit', {
        pathname,
        visitCount: parseInt(localStorage.getItem(`visit_count_${pathname}`) || '0') + 1,
        sessionDuration: Date.now() - parseInt(sessionStorage.getItem('session_start') || '0')
      });

      // Update visit count
      const currentCount = parseInt(localStorage.getItem(`visit_count_${pathname}`) || '0');
      localStorage.setItem(`visit_count_${pathname}`, (currentCount + 1).toString());
    };

    trackPageView();
    setState(prev => ({ ...prev, isLoading: false }));
  }, [pathname, logBehaviorEvent, processBehaviorTriggers]);

  // Initialize session
  useEffect(() => {
    if (!sessionStorage.getItem('session_start')) {
      sessionStorage.setItem('session_start', Date.now().toString());
    }
  }, []);

  // Track user interactions
  useEffect(() => {
    const handleClick = async (event: Event) => {
      const target = event.target as HTMLElement;
      const elementInfo = {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        textContent: target.textContent?.slice(0, 100),
        href: target.getAttribute('href')
      };

      await logBehaviorEvent({
        eventType: 'click',
        eventData: elementInfo
      });

      // Process click-based triggers
      await processBehaviorTriggers('click', {
        element: elementInfo,
        clickCount: parseInt(sessionStorage.getItem('click_count') || '0') + 1
      });

      sessionStorage.setItem('click_count', 
        (parseInt(sessionStorage.getItem('click_count') || '0') + 1).toString()
      );
    };

    const handleScroll = async () => {
      const scrollPercentage = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollPercentage % 25 === 0 && scrollPercentage > 0) {
        await logBehaviorEvent({
          eventType: 'scroll',
          eventData: { 
            scrollPercentage,
            pathname
          }
        });
      }
    };

    const handleFormSubmit = async (event: Event) => {
      const form = event.target as HTMLFormElement;
      await logBehaviorEvent({
        eventType: 'form_submit',
        eventData: {
          formId: form.id,
          formAction: form.action,
          formMethod: form.method
        }
      });

      await processBehaviorTriggers('conversion_event', {
        eventType: 'form_submit',
        formId: form.id
      });
    };

    // Add event listeners
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll);
    document.addEventListener('submit', handleFormSubmit);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('submit', handleFormSubmit);
    };
  }, [logBehaviorEvent, processBehaviorTriggers]);

  // Provide personalization context to child components
  const personalizationContext: PersonalizationContext = {
    state,
    logBehaviorEvent,
    appliedRules: state.appliedRules,
    activeTriggers: state.activeTriggers,
    isPersonalized: state.appliedRules.length > 0
  };

  // Add personalization data to the component tree
  return (
    <div 
      data-personalization-active={state.appliedRules.length > 0}
      data-personalization-context={JSON.stringify(personalizationContext)}
    >
      {children}
    </div>
  );
};

export default PersonalizationEngine;