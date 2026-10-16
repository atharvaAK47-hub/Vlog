import unittest
import json
from backend.app import create_app
from backend.config import TestConfig
from backend.extensions import db

class CommentsTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        # Register User 1
        self.client.post('/api/auth/register', data=json.dumps({
            'username': 'commenter_1',
            'email': 'c1@example.com',
            'password': 'password123'
        }), content_type='application/json')
        
        vlog_res = self.client.post('/api/vlogs', data=json.dumps({
            'title': 'Vlog with Comments',
            'video_path': '/media/uploads/test.mp4'
        }), content_type='application/json')
        self.vlog_id = vlog_res.get_json()['vlog']['id']

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_add_edit_and_delete_comment(self):
        # Add comment
        res = self.client.post(f'/api/vlogs/{self.vlog_id}/comments', data=json.dumps({
            'content': 'This cinematography is stunning!'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 201)
        comment_id = res.get_json()['comment']['id']
        self.assertEqual(res.get_json()['comment']['content'], 'This cinematography is stunning!')
        
        # Edit comment
        edit_res = self.client.put(f'/api/comments/{comment_id}', data=json.dumps({
            'content': 'Updated: The grading in this video is amazing!'
        }), content_type='application/json')
        self.assertEqual(edit_res.status_code, 200)
        self.assertEqual(edit_res.get_json()['comment']['content'], 'Updated: The grading in this video is amazing!')
        
        # Delete comment
        del_res = self.client.delete(f'/api/comments/{comment_id}')
        self.assertEqual(del_res.status_code, 200)

    def test_comment_ownership_protection(self):
        # User 1 posts comment
        res = self.client.post(f'/api/vlogs/{self.vlog_id}/comments', data=json.dumps({
            'content': 'Original comment by user 1'
        }), content_type='application/json')
        comment_id = res.get_json()['comment']['id']
        
        # User 2 logs in
        self.client.post('/api/auth/logout')
        self.client.post('/api/auth/register', data=json.dumps({
            'username': 'commenter_2',
            'email': 'c2@example.com',
            'password': 'password123'
        }), content_type='application/json')
        
        # User 2 tries to edit User 1's comment
        edit_res = self.client.put(f'/api/comments/{comment_id}', data=json.dumps({
            'content': 'Hacked comment'
        }), content_type='application/json')
        self.assertEqual(edit_res.status_code, 403)
        
        # User 2 tries to delete User 1's comment
        del_res = self.client.delete(f'/api/comments/{comment_id}')
        self.assertEqual(del_res.status_code, 403)

    def test_empty_comment_rejected(self):
        res = self.client.post(f'/api/vlogs/{self.vlog_id}/comments', data=json.dumps({
            'content': '   '
        }), content_type='application/json')
        self.assertEqual(res.status_code, 400)

if __name__ == '__main__':
    unittest.main()
