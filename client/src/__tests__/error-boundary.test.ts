
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/error-boundary';

describe('Error Boundary Tests', () => {
  const consoleError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = consoleError;
  });

  it('should catch and display errors', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/test error/i)).toBeInTheDocument();
  });

  it('should handle nested component errors', () => {
    const NestedError = () => {
      return (
        <div>
          <span>Normal content</span>
          {(() => {
            throw new Error('Nested error');
          })()}
        </div>
      );
    };

    render(
      <ErrorBoundary>
        <NestedError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/nested error/i)).toBeInTheDocument();
  });

  it('should render fallback UI when provided', () => {
    const fallback = <div>Custom error UI</div>;
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/custom error ui/i)).toBeInTheDocument();
  });

  it('should reset on try again click', () => {
    let shouldThrow = true;
    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Normal content</div>;
    };

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    
    shouldThrow = false;
    fireEvent.click(screen.getByText(/try again/i));
    
    expect(screen.getByText(/normal content/i)).toBeInTheDocument();
  });
});
