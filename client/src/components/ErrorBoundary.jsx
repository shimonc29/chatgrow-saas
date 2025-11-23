import React from 'react';
import { Box, Button, Heading, Text, VStack, Code, Container } from '@chakra-ui/react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console (in production, send to error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // TODO: Send error to monitoring service (e.g., Sentry)
    // if (process.env.NODE_ENV === 'production') {
    //   sendErrorToMonitoring(error, errorInfo);
    // }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <Container maxW="container.md" centerContent py={20}>
          <VStack spacing={6} align="stretch">
            <Box textAlign="center">
              <Heading size="2xl" mb={4}>😕 אופס, משהו השתבש</Heading>
              <Text fontSize="lg" color="gray.600" mb={6}>
                אנחנו מצטערים, אבל משהו לא עבד כמו שצריך
              </Text>
            </Box>

            <VStack spacing={4}>
              <Button
                colorScheme="blue"
                size="lg"
                onClick={this.handleReload}
                width="full"
              >
                רענן את הדף
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={this.handleGoHome}
                width="full"
              >
                חזור לדף הבית
              </Button>
            </VStack>

            {isDevelopment && this.state.error && (
              <Box
                mt={8}
                p={4}
                bg="red.50"
                borderRadius="md"
                border="1px"
                borderColor="red.200"
              >
                <Heading size="sm" mb={3} color="red.700">
                  פרטי שגיאה (Development Mode)
                </Heading>
                <Code
                  display="block"
                  whiteSpace="pre-wrap"
                  p={4}
                  bg="white"
                  borderRadius="md"
                  fontSize="sm"
                  color="red.600"
                  dir="ltr"
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {'\n\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </Code>
              </Box>
            )}

            <Box textAlign="center" mt={6}>
              <Text fontSize="sm" color="gray.500">
                אם הבעיה נמשכת, אנא צור קשר עם התמיכה
              </Text>
            </Box>
          </VStack>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
