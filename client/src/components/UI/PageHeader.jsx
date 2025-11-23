import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@chakra-ui/react';
import { ChevronLeft } from 'lucide-react';

/**
 * Page Header Component - Zoho Style
 * Consistent header for all pages with title, description, and actions
 */
const PageHeader = ({ title, description, breadcrumbs = [], actions = [], showDivider = true }) => {
  return (
    <Box mb={8}>
      {breadcrumbs.length > 0 && (
        <Breadcrumb
          spacing={2}
          mb={4}
          separator={<ChevronLeft size={16} />}
          fontSize="sm"
          color="gray.600"
        >
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={index} isCurrentPage={index === breadcrumbs.length - 1}>
              <BreadcrumbLink
                href={crumb.href}
                color={index === breadcrumbs.length - 1 ? 'brand.600' : 'gray.600'}
                fontWeight={index === breadcrumbs.length - 1 ? 'semibold' : 'normal'}
              >
                {crumb.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      )}

      <Flex
        justify="space-between"
        align="flex-start"
        wrap={{ base: 'wrap', md: 'nowrap' }}
        gap={4}
        pb={showDivider ? 6 : 0}
        borderBottom={showDivider ? '2px' : '0'}
        borderColor="gray.200"
      >
        <Box flex="1">
          <Heading size="xl" mb={2} color="gray.800">
            {title}
          </Heading>
          {description && (
            <Text color="gray.600" fontSize="lg" maxW="2xl">
              {description}
            </Text>
          )}
        </Box>

        {actions.length > 0 && (
          <Flex gap={3} wrap="wrap">
            {actions.map((action, index) => (
              <Button
                key={index}
                colorScheme={action.colorScheme || 'brand'}
                variant={action.variant || 'solid'}
                leftIcon={action.icon}
                onClick={action.onClick}
                isLoading={action.isLoading}
                size="lg"
              >
                {action.label}
              </Button>
            ))}
          </Flex>
        )}
      </Flex>
    </Box>
  );
};

export default PageHeader;
