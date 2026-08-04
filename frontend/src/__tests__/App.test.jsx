import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import React from 'react';

// A simple test to verify testing setup is working
test('renders basic test successfully', () => {
  render(<div>AgroVision PWA Testing</div>);
  const textElement = screen.getByText(/AgroVision PWA/i);
  expect(textElement).toBeInTheDocument();
});
