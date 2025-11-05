import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  direction: 'rtl',
  fonts: {
    heading: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif`,
    body: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif`,
  },
  colors: {
    brand: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    primary: {
      50: '#f0e7ff',
      100: '#d5b8ff',
      200: '#ba8aff',
      300: '#9f5bff',
      400: '#842dff',
      500: '#6a13e6',
      600: '#530fb4',
      700: '#3c0b82',
      800: '#250650',
      900: '#0e021f',
    }
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
  },
});

export default theme;
