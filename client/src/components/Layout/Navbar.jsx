import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box bg="white" px={8} py={4} shadow="sm" borderBottomWidth="1px">
      <Flex justify="space-between" align="center">
        <Heading size="md" color="brand.600" cursor="pointer" onClick={() => navigate('/dashboard')}>
          🎉 ChatGrow
        </Heading>

        <HStack spacing={6}>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            דאשבורד
          </Button>
          <Button variant="ghost" onClick={() => navigate('/events')}>
            אירועים
          </Button>

          <Menu>
            <MenuButton>
              <HStack spacing={2}>
                <Avatar size="sm" name={user?.email} />
                <Text fontWeight="medium">{user?.email}</Text>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => navigate('/profile')}>הפרופיל שלי</MenuItem>
              <MenuItem onClick={() => navigate('/settings')}>הגדרות</MenuItem>
              <MenuItem onClick={handleLogout} color="red.500">
                התנתק
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;
