import { Box, Heading, Text } from '@chakra-ui/react';

function App() {
  return (
    <Box minH="100vh" bgGradient="linear(to-br, purple.500, pink.500)" display="flex" alignItems="center" justifyContent="center">
      <Box textAlign="center" color="white" p={8}>
        <Heading size="2xl" mb={4}>🎉 ChatGrow Frontend</Heading>
        <Text fontSize="xl">React + Chakra UI + RTL Support</Text>
        <Text mt={4}>המערכת מוכנה לעבודה!</Text>
      </Box>
    </Box>
  );
}

export default App;
