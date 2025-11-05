import React from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
} from '@chakra-ui/react';
import MainLayout from '../../components/Layout/MainLayout';

const Dashboard = () => {
  return (
    <MainLayout>
      <Container maxW="container.xl">
        <Heading mb={8}>דאשבורד ניהולי</Heading>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>אירועים פעילים</StatLabel>
                <StatNumber>12</StatNumber>
                <StatHelpText>החודש</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>נרשמים</StatLabel>
                <StatNumber>248</StatNumber>
                <StatHelpText>סה"כ</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>הכנסות</StatLabel>
                <StatNumber>₪24,500</StatNumber>
                <StatHelpText>החודש</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>ממוצע לאירוע</StatLabel>
                <StatNumber>20.7</StatNumber>
                <StatHelpText>משתתפים</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Heading size="md" mb={4}>
          האירועים הקרובים
        </Heading>
        <Box bg="white" p={6} borderRadius="lg" shadow="sm">
          <Heading size="sm" color="gray.500">
            בקרוב - רשימת אירועים
          </Heading>
        </Box>
      </Container>
    </MainLayout>
  );
};

export default Dashboard;
