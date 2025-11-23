import { extendTheme } from '@chakra-ui/react';

/**
 * ChatGrow Custom Theme - Inspired by Zoho
 * Modern, clean, user-friendly design with light colors and dark text
 */

const theme = extendTheme({
  // Color Palette - Light & Professional (Zoho style)
  colors: {
    brand: {
      50: '#E6F6FF',
      100: '#BAE3FF',
      200: '#7CC4FA',
      300: '#47A3F3',
      400: '#2186EB',
      500: '#0967D2', // Primary brand color
      600: '#0552B5',
      700: '#03449E',
      800: '#01337D',
      900: '#002159',
    },
    gray: {
      50: '#F7FAFC',
      100: '#EDF2F7',
      200: '#E2E8F0',
      300: '#CBD5E0',
      400: '#A0AEC0',
      500: '#718096',
      600: '#4A5568',
      700: '#2D3748',
      800: '#1A202C',
      900: '#171923',
    },
    success: {
      50: '#E6FFFA',
      100: '#B2F5EA',
      200: '#81E6D9',
      300: '#4FD1C5',
      400: '#38B2AC',
      500: '#319795',
      600: '#2C7A7B',
      700: '#285E61',
      800: '#234E52',
      900: '#1D4044',
    },
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },
    error: {
      50: '#FFF5F5',
      100: '#FED7D7',
      200: '#FEB2B2',
      300: '#FC8181',
      400: '#F56565',
      500: '#E53E3E',
      600: '#C53030',
      700: '#9B2C2C',
      800: '#822727',
      900: '#63171B',
    },
  },

  // Typography - Clean & Modern
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
    mono: `'Fira Code', 'Courier New', monospace`,
  },

  fontSizes: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    md: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
  },

  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Spacing - Consistent & Balanced
  space: {
    px: '1px',
    0: '0',
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
  },

  // Border Radius - Soft & Modern
  radii: {
    none: '0',
    sm: '0.25rem', // 4px
    base: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem', // 32px
    full: '9999px',
  },

  // Shadows - Subtle & Professional
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    outline: '0 0 0 3px rgba(9, 103, 210, 0.3)',
    inner: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)',
  },

  // Global Styles - Light & Clean
  styles: {
    global: {
      body: {
        bg: 'gray.50', // #F7FAFC - רקע בהיר מאוד
        color: 'gray.700', // #2D3748 - טקסט רגיל כהה
        fontFamily: 'body',
        lineHeight: 'base',
      },
      'h1, h2, h3, h4, h5, h6': {
        color: 'gray.800', // #1A202C - כותרות כהות
      },
      '*::placeholder': {
        color: 'gray.400',
      },
      '*, *::before, &::after': {
        borderColor: 'gray.200',
      },
      // קישורים
      'a': {
        color: 'brand.500', // #0967D2 - כחול עיקרי
        _hover: {
          color: 'brand.600', // #0552B5 - כחול כהה יותר
        },
      },
    },
  },

  // Component Style Overrides
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md',
        _focus: {
          boxShadow: 'outline',
        },
      },
      sizes: {
        sm: {
          fontSize: 'sm',
          px: 4,
          py: 2,
        },
        md: {
          fontSize: 'md',
          px: 6,
          py: 3,
        },
        lg: {
          fontSize: 'lg',
          px: 8,
          py: 4,
        },
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            transform: 'translateY(-2px)',
            boxShadow: 'md',
          },
          _active: {
            bg: 'brand.700',
            transform: 'translateY(0)',
          },
          transition: 'all 0.2s',
        },
        outline: {
          borderWidth: '2px',
          borderColor: 'brand.500',
          color: 'brand.500',
          _hover: {
            bg: 'brand.50',
            transform: 'translateY(-2px)',
            boxShadow: 'sm',
          },
          transition: 'all 0.2s',
        },
        ghost: {
          color: 'brand.500',
          _hover: {
            bg: 'brand.50',
          },
        },
      },
      defaultProps: {
        size: 'md',
        variant: 'solid',
        colorScheme: 'brand',
      },
    },

    Input: {
      variants: {
        outline: {
          field: {
            borderWidth: '2px',
            borderColor: 'gray.200',
            bg: 'white',
            _hover: {
              borderColor: 'gray.300',
            },
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
            },
          },
        },
      },
      defaultProps: {
        variant: 'outline',
        size: 'md',
      },
    },

    Card: {
      baseStyle: {
        container: {
          bg: 'white', // #FFFFFF - כרטיסים לבנים
          borderRadius: 'lg',
          boxShadow: 'sm',
          border: '1px',
          borderColor: 'gray.200',
          transition: 'all 0.2s',
          _hover: {
            boxShadow: 'md',
            transform: 'translateY(-2px)',
          },
        },
      },
    },

    Heading: {
      baseStyle: {
        color: 'gray.800', // #1A202C - כותרות כהות
        fontWeight: 'bold',
      },
    },

    Text: {
      baseStyle: {
        color: 'gray.700', // #2D3748 - טקסט רגיל
      },
      variants: {
        secondary: {
          color: 'gray.600', // #4A5568 - טקסט משני
        },
      },
    },

    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: 'xl',
          boxShadow: 'xl',
        },
      },
    },

    Drawer: {
      baseStyle: {
        dialog: {
          bg: 'white',
        },
      },
    },

    Menu: {
      baseStyle: {
        list: {
          bg: 'white',
          borderRadius: 'md',
          border: '1px',
          borderColor: 'gray.200',
          boxShadow: 'lg',
        },
        item: {
          _hover: {
            bg: 'brand.50',
          },
          _focus: {
            bg: 'brand.50',
          },
        },
      },
    },

    Tabs: {
      variants: {
        line: {
          tab: {
            color: 'gray.600',
            fontWeight: 'medium',
            _selected: {
              color: 'brand.600',
              borderColor: 'brand.600',
              fontWeight: 'semibold',
            },
            _hover: {
              color: 'brand.500',
            },
          },
        },
      },
    },

    Tooltip: {
      baseStyle: {
        bg: 'gray.800',
        color: 'white',
        borderRadius: 'md',
        px: 3,
        py: 2,
        fontSize: 'sm',
      },
    },
  },

  // Transition Configuration
  transition: {
    duration: {
      ultraFast: '50ms',
      faster: '100ms',
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '400ms',
      ultraslow: '500ms',
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Direction (RTL support for Hebrew)
  direction: 'rtl',
});

export default theme;
