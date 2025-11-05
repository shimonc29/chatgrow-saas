import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Text,
  Link,
  useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'הסיסמאות לא תואמות',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setLoading(true);

    const result = await register({ email, password });

    if (result.success) {
      toast({
        title: 'נרשמת בהצלחה!',
        status: 'success',
        duration: 3000,
      });
      navigate('/dashboard');
    } else {
      toast({
        title: 'שגיאה ברישום',
        description: result.error,
        status: 'error',
        duration: 5000,
      });
    }

    setLoading(false);
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-br, brand.500, purple.600)" display="flex" alignItems="center">
      <Container maxW="md">
        <Box bg="white" p={8} borderRadius="lg" shadow="xl">
          <VStack spacing={6}>
            <Heading size="xl">הרשמה</Heading>
            <Text color="gray.600">צור חשבון חדש ב-ChatGrow</Text>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>אימייל</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>סיסמה</FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>אימות סיסמה</FormLabel>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="brand"
                  width="full"
                  size="lg"
                  isLoading={loading}
                  loadingText="נרשם..."
                >
                  הירשם
                </Button>
              </VStack>
            </form>

            <Text fontSize="sm">
              יש לך כבר חשבון?{' '}
              <Link color="brand.500" fontWeight="bold" onClick={() => navigate('/login')}>
                התחבר עכשיו
              </Link>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default Register;
