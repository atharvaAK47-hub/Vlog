import unittest
import json
from backend.app import create_app
from backend.config import TestConfig
from backend.extensions import db

class LikesTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        # Register user and create vlog
        self.client.post('/api/auth/register', data=json.dumps({
            'username': 'creator',
            'email': 'creator@example.com',
            'password': 'password123'
        }), content_type='application/json')
        
        vlog_res = self.client.post('/api/vlogs', data=json.dumps({
            'title': 'Test Vlog for Likes',
            'video_path': '/media/uploads/test.mp4'
        }), content_type='application/json')
        self.vlog_id = vlog_res.get_json()['vlog']['id']

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_like_and_duplicate_prevention(self):
        # Like vlog
        res1 = self.client.post(f'/api/vlogs/{self.vlog_id}/like')
        self.assertEqual(res1.status_code, 201)
        self.assertTrue(res1.get_json()['has_liked'])
        self.assertEqual(res1.get_json()['likes_count'], 1)
        
        # Like again (duplicate attempt)
        res2 = self.client.post(f'/api/vlogs/{self.vlog_id}/like')
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.get_json()['likes_count'], 1)

    def test_unlike_functionality(self):
        # Like first
        self.client.post(f'/api/vlogs/{self.vlog_id}/like')
        
        # Unlike
        unlike_res = self.client.delete(f'/api/vlogs/{self.vlog_id}/like')
        self.assertEqual(unlike_res.status_code, 200)
        self.assertFalse(unlike_res.get_json()['has_liked'])
        self.assertEqual(unlike_res.get_json()['likes_count'], 0)

if __name__ == '__main__':
    unittest.main()
