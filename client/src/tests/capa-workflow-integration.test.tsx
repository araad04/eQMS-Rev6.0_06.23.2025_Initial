import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WorkflowControlForms from '../components/capa/workflow-control-forms';

// Mock the API requests
vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn()
}));

// Mock the toast hook
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Enhanced CAPA Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('5-Phase CAPA Workflow System', () => {
    it('should render Phase 1: CORRECTION form correctly', () => {
      render(
        <TestWrapper>
          <WorkflowControlForms
            capaId={11}
            currentPhase="CORRECTION"
            onPhaseUpdate={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Phase 1: Immediate Correction & Containment')).toBeDefined();
      expect(screen.getByText('Problem Description *')).toBeDefined();
      expect(screen.getByText('Immediate Action Taken *')).toBeDefined();
    });

    it('should render Phase 2: ROOT_CAUSE_ANALYSIS with fishbone diagram', () => {
      render(
        <TestWrapper>
          <WorkflowControlForms
            capaId={11}
            currentPhase="ROOT_CAUSE_ANALYSIS"
            onPhaseUpdate={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Phase 2: Root Cause Analysis - Fishbone Diagram')).toBeDefined();
      expect(screen.getByText('People')).toBeDefined();
      expect(screen.getByText('Process')).toBeDefined();
      expect(screen.getByText('Equipment')).toBeDefined();
    });

    it('should render Phase 3: CORRECTIVE_ACTION form', () => {
      render(
        <TestWrapper>
          <WorkflowControlForms
            capaId={11}
            currentPhase="CORRECTIVE_ACTION"
            onPhaseUpdate={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Phase 3: Corrective Action Implementation')).toBeDefined();
    });

    it('should render Phase 4: PREVENTIVE_ACTION form', () => {
      render(
        <TestWrapper>
          <WorkflowControlForms
            capaId={11}
            currentPhase="PREVENTIVE_ACTION"
            onPhaseUpdate={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Phase 4: Preventive Action Implementation')).toBeDefined();
    });

    it('should render Phase 5: EFFECTIVENESS_VERIFICATION form', () => {
      render(
        <TestWrapper>
          <WorkflowControlForms
            capaId={11}
            currentPhase="EFFECTIVENESS_VERIFICATION"
            onPhaseUpdate={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Phase 5: Effectiveness Verification')).toBeDefined();
    });
  });
});