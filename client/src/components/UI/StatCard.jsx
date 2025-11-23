import { Box, Stat, StatLabel, StatNumber, StatHelpText, Icon, Flex } from '@chakra-ui/react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Modern Stat Card Component - Zoho Style
 * Clean, professional statistics display
 */
const StatCard = ({
  label,
  value,
  change,
  changeType = 'increase',
  icon: IconComponent,
  colorScheme = 'brand',
  helpText,
}) => {
  const isIncrease = changeType === 'increase';
  const trendColor = isIncrease ? 'success.500' : 'error.500';
  const bgColor = `${colorScheme}.50`;
  const iconColor = `${colorScheme}.500`;

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="lg"
      boxShadow="sm"
      border="1px"
      borderColor="gray.200"
      transition="all 0.2s"
      _hover={{
        boxShadow: 'md',
        transform: 'translateY(-2px)',
      }}
    >
      <Flex justify="space-between" align="flex-start" mb={4}>
        <Stat>
          <StatLabel fontSize="sm" color="gray.600" fontWeight="medium" mb={2}>
            {label}
          </StatLabel>
          <StatNumber fontSize="3xl" fontWeight="bold" color="gray.800" mb={1}>
            {value}
          </StatNumber>
          {change && (
            <StatHelpText mb={0} fontSize="sm">
              <Flex align="center" gap={1} color={trendColor} fontWeight="medium">
                <Icon as={isIncrease ? TrendingUp : TrendingDown} boxSize={4} />
                <Box as="span">{change}</Box>
              </Flex>
            </StatHelpText>
          )}
          {helpText && !change && (
            <StatHelpText fontSize="sm" color="gray.500">
              {helpText}
            </StatHelpText>
          )}
        </Stat>

        {IconComponent && (
          <Box bg={bgColor} p={3} borderRadius="lg">
            <Icon as={IconComponent} boxSize={6} color={iconColor} />
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default StatCard;
