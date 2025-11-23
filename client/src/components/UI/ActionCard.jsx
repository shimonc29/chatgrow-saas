import { Box, Heading, Text, Button, Icon, Flex, VStack } from '@chakra-ui/react';
import { ArrowLeft } from 'lucide-react';

/**
 * Action Card Component - Zoho Style
 * For displaying actionable items with clear CTAs
 */
const ActionCard = ({
  title,
  description,
  icon: IconComponent,
  buttonText = 'התחל',
  onAction,
  colorScheme = 'brand',
  isLoading = false,
  children,
}) => {
  const bgColor = `${colorScheme}.50`;
  const iconColor = `${colorScheme}.500`;

  return (
    <Box
      bg="white"
      p={8}
      borderRadius="xl"
      boxShadow="sm"
      border="1px"
      borderColor="gray.200"
      transition="all 0.3s"
      _hover={{
        boxShadow: 'lg',
        transform: 'translateY(-4px)',
      }}
      h="100%"
    >
      <VStack align="stretch" spacing={6} h="100%">
        {IconComponent && (
          <Box bg={bgColor} p={4} borderRadius="lg" w="fit-content">
            <Icon as={IconComponent} boxSize={8} color={iconColor} />
          </Box>
        )}

        <VStack align="stretch" spacing={3} flex="1">
          <Heading size="md" color="gray.800">
            {title}
          </Heading>
          <Text color="gray.600" fontSize="md" lineHeight="tall">
            {description}
          </Text>
          {children}
        </VStack>

        {onAction && (
          <Button
            colorScheme={colorScheme}
            size="lg"
            onClick={onAction}
            isLoading={isLoading}
            rightIcon={<Icon as={ArrowLeft} />}
            w="100%"
          >
            {buttonText}
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default ActionCard;
