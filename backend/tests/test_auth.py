import unittest
import json
from backend.app import create_app
from backend.config import TestConfig
from backend.extensions import db

class AuthTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_registration_success(self):
        res = self.client.post('/api/auth/register', data=json.dumps({
            'username': 'creative_user',
            'email': 'creator@example.com',
            'password': 'password123',
            'confirm_password': 'password123'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data['user']['username'], 'creative_user')
        self.assertEqual(data['user']['email'], 'creator@example.com')

    def test_duplicate_email_rejection(self):
        self.client.post('/api/auth/register', data=json.dumps({
            'username': 'user1',
            'email': 'same@example.com',
            'password': 'password123'
        }), content_type='application/json')
        
        res = self.client.post('/api/auth/register', data=json.dumps({
            'username': 'user2',
            'email': 'same@example.com',
            'password': 'password456'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 409)
        self.assertIn('Email address already registered', res.get_json()['error'])

    def test_duplicate_username_rejection(self):
        self.client.post('/api/auth/register', data=json.dumps({
            'username': 'unique_name',
            'email': 'first@example.com',
            'password': 'password123'
        }), content_type='application/json')
        
        res = self.client.post('/api/auth/register', data=json.dumps({
            'username': 'unique_name',
            'email': 'second@example.com',
            'password': 'password456'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 409)
        self.assertIn('Username already taken', res.get_json()['error'])

    def test_login_valid_and_invalid(self):
        # Register user
        self.client.post('/api/auth/register', data=json.dumps({
            'username': 'login_tester',
            'email': 'tester@example.com',
            'password': 'correct_password'
        }), content_type='application/json')
        
        # Test invalid password
        bad_res = self.client.post('/api/auth/login', data=json.dumps({
            'email': 'tester@example.com',
            'password': 'wrong_password'
        }), content_type='application/json')
        self.assertEqual(bad_res.status_code, 401)
        
        # Test valid login
        good_res = self.client.post('/api/auth/login', data=json.dumps({
            'email': 'tester@example.com',
            'password': 'correct_password'
        }), content_type='application/json')
        self.assertEqual(good_res.status_code, 200)
        self.assertEqual(good_res.get_json()['user']['username'], 'login_tester')
        
        # Test me
        me_res = self.client.get('/api/auth/me')
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.get_json()['user']['username'], 'login_tester')
        
        # Test logout
        logout_res = self.client.post('/api/auth/logout')
        self.assertEqual(logout_res.status_code, 200)
        
        # Verify me is now null
        me_after = self.client.get('/api/auth/me')
        self.assertIsNone(me_after.get_json()['user'])

if __name__ == '__main__':
    unittest.main()
