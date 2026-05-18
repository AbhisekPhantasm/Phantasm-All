/**
 * testData.ts — Centralised test data for KRC College automation suite
 */

export const VALID_USER = {
  name: 'Ravi Kumar',
  email: 'ravi.kumar@example.com',
  phone: '9876543210',
  message: 'I am interested in enrolling for IIT-JEE coaching. Please share details.',
};

export const INVALID_USER = {
  name: '',
  email: 'not-an-email',
  phone: '123',
  message: '',
};

export const BOUNDARY_USER = {
  name: 'A',
  email: 'a@b.co',
  phone: '0000000000',
  message: 'x'.repeat(500),
};

export const URLS = {
  home: '/',
  about: '/about',
  iitjee: '/iit-jee-academy',
  results: '/results',
  facilities: '/facilities',
  admissions: '/admissions',
  blog: '/blog',
  contact: '/Contact-us',
};

export const EXPECTED_TITLE_KEYWORDS = {
  home: 'KRC',
  about: 'KRC',
  iitjee: 'IIT',
  results: 'KRC',
  facilities: 'KRC',
  admissions: 'KRC',
  blog: 'KRC',
  contact: 'KRC',
};

export const CONTACT_INFO = {
  phone: '98485 48321',
  email: 'krcvijayawada5@gmail.com',
  address: 'Kanuru',
};
