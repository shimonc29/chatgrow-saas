import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  SimpleGrid,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  Divider,
} from '@chakra-ui/react';
import {
  Calendar,
  Users,
  ClipboardList,
  DollarSign,
  Plus,
  UserPlus,
  CalendarPlus,
  MapPin,
  Mail,
  Phone,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/Layout/MainLayout';
import { StatCard, ActionCard, PageHeader, EmptyState } from '../../components/UI';
import { statsAPI } from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await statsAPI.getDashboard();
      setStats(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('שגיאה בטעינת סטטיסטיקות');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateString => {
    if (!dateString) {
      return '-';
    }
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const formatTime = dateString => {
    if (!dateString) {
      return '-';
    }
    return new Date(dateString).toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLocation = location => {
    if (!location) {
      return 'לא צוין';
    }
    if (typeof location === 'string') {
      return location;
    }
    if (location.address?.street) {
      return location.address.street;
    }
    if (location.address) {
      return 'כתובת זמינה';
    }
    return 'לא צוין';
  };

  if (loading) {
    return (
      <MainLayout>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} minH="60vh" justify="center">
            <Spinner size="xl" thickness="4px" speed="0.65s" color="brand.500" />
            <Text color="gray.600" fontSize="lg">
              טוען נתונים...
            </Text>
          </VStack>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxW="container.xl" py={8}>
        {/* Welcome Header */}
        <Box
          bg="linear-gradient(135deg, #0967D2 0%, #2186EB 100%)"
          borderRadius="2xl"
          p={10}
          mb={8}
          boxShadow="xl"
        >
          <Heading size="2xl" color="white" mb={3}>
            שלום {user?.name || 'משתמש'}! 👋
          </Heading>
          <Text fontSize="xl" color="whiteAlpha.900">
            כאן תוכל לנהל את הקליניקה, הפגישות והלקוחות שלך במקום אחד
          </Text>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert status="error" variant="left-accent" borderRadius="lg" mb={6} boxShadow="sm">
            <AlertIcon />
            <AlertTitle>שגיאה</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6} mb={8}>
          <StatCard
            label="אירועים פעילים"
            value={stats?.overview?.activeEvents || 0}
            helpText={`סה"כ ${stats?.overview?.totalEvents || 0} אירועים`}
            icon={Calendar}
            colorScheme="brand"
          />

          <StatCard
            label="לקוחות"
            value={stats?.overview?.totalCustomers || 0}
            change={`+${stats?.overview?.newCustomersWeek || 0} השבוע`}
            changeType="increase"
            icon={Users}
            colorScheme="success"
          />

          <StatCard
            label="תורים"
            value={stats?.overview?.totalAppointments || 0}
            helpText={`${stats?.overview?.weekAppointments || 0} השבוע`}
            icon={ClipboardList}
            colorScheme="warning"
          />

          <StatCard
            label="הכנסות משוערות"
            value={`₪${stats?.overview?.totalRevenue?.toLocaleString() || 0}`}
            helpText={`החודש ₪${stats?.overview?.monthRevenue?.toLocaleString() || 0}`}
            icon={DollarSign}
            colorScheme="success"
          />
        </SimpleGrid>

        {/* Quick Actions */}
        <Box mb={8}>
          <Heading size="lg" mb={6} color="gray.800">
            פעולות מהירות
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <ActionCard
              title="אירוע חדש"
              description="צור אירוע חדש והתחל לנהל משתתפים"
              icon={CalendarPlus}
              buttonText="צור אירוע"
              onAction={() => navigate('/events')}
              colorScheme="brand"
            />

            <ActionCard
              title="לקוח חדש"
              description="הוסף לקוח חדש למערכת שלך"
              icon={UserPlus}
              buttonText="הוסף לקוח"
              onAction={() => navigate('/customers')}
              colorScheme="success"
            />

            <ActionCard
              title="ניהול תורים"
              description="קבע ונהל תורים עם הלקוחות שלך"
              icon={Plus}
              buttonText="נהל תורים"
              onAction={() => navigate('/appointments')}
              colorScheme="warning"
            />
          </SimpleGrid>
        </Box>

        <Divider my={8} />

        {/* Recent Activity Grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Upcoming Events */}
          <Box>
            <Heading size="lg" mb={6} color="gray.800">
              אירועים קרובים
            </Heading>
            {stats?.upcomingEvents && stats.upcomingEvents.length > 0 ? (
              <VStack spacing={4} align="stretch">
                {stats.upcomingEvents.map(event => (
                  <Box
                    key={event._id}
                    bg="white"
                    p={6}
                    borderRadius="lg"
                    border="1px"
                    borderColor="gray.200"
                    boxShadow="sm"
                    _hover={{
                      boxShadow: 'md',
                      transform: 'translateY(-2px)',
                      borderColor: 'brand.300',
                    }}
                    transition="all 0.2s"
                    cursor="pointer"
                    onClick={() => navigate(`/events/${event._id}`)}
                  >
                    <HStack spacing={4} align="flex-start">
                      <Box
                        bg="brand.50"
                        p={3}
                        borderRadius="lg"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Calendar size={24} color="var(--chakra-colors-brand-500)" />
                      </Box>
                      <VStack align="stretch" flex={1} spacing={2}>
                        <Heading size="md" color="gray.800">
                          {event.name}
                        </Heading>
                        <HStack spacing={3} fontSize="sm" color="gray.600">
                          <HStack>
                            <Clock size={16} />
                            <Text>
                              {formatDate(event.startDateTime)} • {formatTime(event.startDateTime)}
                            </Text>
                          </HStack>
                        </HStack>
                        <HStack spacing={3} fontSize="sm" color="gray.600">
                          <HStack>
                            <MapPin size={16} />
                            <Text>{getLocation(event.location)}</Text>
                          </HStack>
                          <Text>•</Text>
                          <HStack>
                            <Users size={16} />
                            <Text>{event.participants} משתתפים</Text>
                          </HStack>
                        </HStack>
                      </VStack>
                      <Badge colorScheme="brand" fontSize="sm" px={3} py={1}>
                        {event.status || 'פעיל'}
                      </Badge>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            ) : (
              <EmptyState
                icon={Calendar}
                title="אין אירועים קרובים"
                description="צור אירוע חדש כדי להתחיל לנהל את האירועים שלך"
                actionLabel="צור אירוע"
                onAction={() => navigate('/events')}
                colorScheme="brand"
              />
            )}
          </Box>

          {/* Recent Customers */}
          <Box>
            <Heading size="lg" mb={6} color="gray.800">
              לקוחות אחרונים
            </Heading>
            {stats?.recentCustomers && stats.recentCustomers.length > 0 ? (
              <VStack spacing={4} align="stretch">
                {stats.recentCustomers.map(customer => (
                  <Box
                    key={customer._id}
                    bg="white"
                    p={6}
                    borderRadius="lg"
                    border="1px"
                    borderColor="gray.200"
                    boxShadow="sm"
                    _hover={{
                      boxShadow: 'md',
                      transform: 'translateY(-2px)',
                      borderColor: 'success.300',
                    }}
                    transition="all 0.2s"
                    cursor="pointer"
                    onClick={() => navigate(`/customers/${customer._id}`)}
                  >
                    <HStack spacing={4} align="flex-start">
                      <Box
                        bg="success.50"
                        p={3}
                        borderRadius="lg"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Users size={24} color="var(--chakra-colors-success-500)" />
                      </Box>
                      <VStack align="stretch" flex={1} spacing={2}>
                        <Heading size="md" color="gray.800">
                          {customer.name}
                        </Heading>
                        {customer.phone && (
                          <HStack spacing={2} fontSize="sm" color="gray.600">
                            <Phone size={16} />
                            <Text>{customer.phone}</Text>
                          </HStack>
                        )}
                        {customer.email && (
                          <HStack spacing={2} fontSize="sm" color="gray.600">
                            <Mail size={16} />
                            <Text>{customer.email}</Text>
                          </HStack>
                        )}
                        <Text fontSize="xs" color="gray.500">
                          הצטרף: {formatDate(customer.createdAt)}
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            ) : (
              <EmptyState
                icon={Users}
                title="אין לקוחות עדיין"
                description="הוסף את הלקוח הראשון שלך כדי להתחיל"
                actionLabel="הוסף לקוח"
                onAction={() => navigate('/customers')}
                colorScheme="success"
              />
            )}
          </Box>
        </SimpleGrid>
      </Container>
    </MainLayout>
  );
};

export default Dashboard;
