import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';

/**
 * Custom render function that wraps components with necessary providers
 * Usage: const { getByText } = renderWithProviders(<MyComponent />)
 */
export function renderWithProviders(ui, options = {}) {
  const Wrapper = ({ children }) => (
    <ChakraProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </ChakraProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock authentication context
 */
export const mockAuthContext = {
  user: {
    _id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'provider',
  },
  isAuthenticated: true,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
};

/**
 * Create mock API response
 */
export function createMockApiResponse(data, success = true) {
  return {
    success,
    ...data,
  };
}

/**
 * Wait for async operations to complete
 */
export const waitFor = (callback, options) =>
  import('@testing-library/react').then(({ waitFor: wait }) => wait(callback, options));
