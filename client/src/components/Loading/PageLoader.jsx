import { Box, Spinner, VStack, Text } from '@chakra-ui/react';

/**
 * Loading component for lazy-loaded pages
 * Shows a centered spinner while the page bundle is being loaded
 */
function PageLoader({ message = 'טוען...' }) {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" bg="gray.50">
      <VStack spacing={4}>
        <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />
        <Text color="gray.600" fontSize="lg">
          {message}
        </Text>
      </VStack>
    </Box>
  );
}

export default PageLoader;
