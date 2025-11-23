import { Box, Heading, Text, Button, VStack, Icon } from '@chakra-ui/react';
import { Inbox } from 'lucide-react';

/**
 * Empty State Component - Zoho Style
 * Friendly empty state for when there's no data
 */
const EmptyState = ({
  icon: IconComponent = Inbox,
  title = 'אין נתונים להצגה',
  description,
  actionLabel,
  onAction,
  colorScheme = 'brand',
}) => {
  return (
    <Box
      bg="white"
      p={16}
      borderRadius="xl"
      border="2px"
      borderStyle="dashed"
      borderColor="gray.300"
      textAlign="center"
    >
      <VStack spacing={6}>
        <Box bg={`${colorScheme}.50`} p={6} borderRadius="full" display="inline-flex">
          <Icon as={IconComponent} boxSize={12} color={`${colorScheme}.400`} />
        </Box>

        <VStack spacing={3}>
          <Heading size="lg" color="gray.700">
            {title}
          </Heading>
          {description && (
            <Text color="gray.600" fontSize="md" maxW="md">
              {description}
            </Text>
          )}
        </VStack>

        {onAction && actionLabel && (
          <Button colorScheme={colorScheme} size="lg" onClick={onAction} mt={2}>
            {actionLabel}
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default EmptyState;
