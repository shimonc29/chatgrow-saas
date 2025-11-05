import React from 'react';
import { Box } from '@chakra-ui/react';
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Box as="main" p={8}>
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
