import unittest
import json
from backend.app import create_app
from backend.config import TestConfig
from backend.extensions import db
from backend.models import User, Category

class VlogsTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        
        # Create category
        self.category = Category(name='Travel & Exploration', slug='travel')
        db.session.add(self.category)
        db.session.commit()

        # Register User A
        self.client.post('/api/auth/register', data=json.dumps({
            'username': 'creator_a',
            'email': 'a@example.com',
            'password': 'password123'
        }), content_type='application/json')
        
        # User A is currently logged in

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_unauthorized_upload_attempt(self):
        self.client.post('/api/auth/logout')
        res = self.client.post('/api/vlogs', data=json.dumps({
            'title': 'Secret Journey',
            'video_path': '/media/uploads/test.mp4'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 401)

    def test_successful_vlog_upload_and_read(self):
        # Create vlog as creator_a
        res = self.client.post('/api/vlogs', data=json.dumps({
            'title': 'Tokyo Neon Nights',
            'description': 'Exploring rainy alleys in Shinjuku',
            'video_path': '/media/uploads/videos/tokyo.mp4',
            'thumbnail_path': '/media/uploads/thumbnails/tokyo.jpg',
            'category_id': self.category.id,
            'tags': ['tokyo', 'travel', 'night']
        }), content_type='application/json')
        self.assertEqual(res.status_code, 201)
        vlog_id = res.get_json()['vlog']['id']
        
        # Read vlog
        get_res = self.client.get(f'/api/vlogs/{vlog_id}')
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.get_json()['vlog']['title'], 'Tokyo Neon Nights')
        self.assertEqual(get_res.get_json()['vlog']['views_count'], 1)

    def test_author_can_edit_and_delete_vlog(self):
        # Create vlog
        res = self.client.post('/api/vlogs', data=json.dumps({
            'title': 'Original Title',
            'video_path': '/media/uploads/test.mp4'
        }), content_type='application/json')
        vlog_id = res.get_json()['vlog']['id']
        
        # Edit vlog
        edit_res = self.client.put(f'/api/vlogs/{vlog_id}', data=json.dumps({
            'title': 'Updated Title'
        }), content_type='application/json')
        self.assertEqual(edit_res.status_code, 200)
        self.assertEqual(edit_res.get_json()['vlog']['title'], 'Updated Title')
        
        # Delete vlog
        del_res = self.client.delete(f'/api/vlogs/{vlog_id}')
        self.assertEqual(del_res.status_code, 200)
        
        # Confirm deleted
        check_res = self.client.get(f'/api/vlogs/{vlog_id}')
        self.assertEqual(check_res.status_code, 404)

    def test_user_cannot_edit_or_delete_others_vlog(self):
        # Create vlog as creator_a
        res = self.client.post('/api/vlogs', data=json.dumps({
            'title': 'Creator A Vlog',
            'video_path': '/media/uploads/a.mp4'
        }), content_type='application/json')
        vlog_id = res.get_json()['vlog']['id']
        
        # Logout creator_a, register creator_b
        self.client.post('/api/auth/logout')
        self.client.post('/api/auth/register', data=json.dumps({
            'username': 'creator_b',
            'email': 'b@example.com',
            'password': 'password123'
        }), content_type='application/json')
        
        # Try to edit creator_a's vlog
        edit_res = self.client.put(f'/api/vlogs/{vlog_id}', data=json.dumps({
            'title': 'Hacked Title'
        }), content_type='application/json')
        self.assertEqual(edit_res.status_code, 403)
        
        # Try to delete creator_a's vlog
        del_res = self.client.delete(f'/api/vlogs/{vlog_id}')
        self.assertEqual(del_res.status_code, 403)

if __name__ == '__main__':
    unittest.main()
