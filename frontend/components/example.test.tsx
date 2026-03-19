import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// Using a simple component for verification
const SimpleComponent = () => <div>Hello, Mahbub Shop!</div>;

describe('Frontend Example Test', () => {
  it('should render the simple component', () => {
    render(<SimpleComponent />);
    expect(screen.getByText('Hello, Mahbub Shop!')).toBeDefined();
  });
});
