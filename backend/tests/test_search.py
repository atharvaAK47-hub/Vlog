import unittest
import json
from backend.app import create_app
from backend.config import TestConfig
from backend.extensions import db
from backend.models import Category

class SearchTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        # Seed categories
        self.cat1 = Category(name='Cinematography', slug='cinematography')
        self.cat2 = Category(name='Travel & Adventure', slug='travel')
        db.session.add_all([self.cat1, self.cat2])
        db.session.commit()

        # Register user
        self.client.post('/api/auth/register', data=json.dumps({
            'username': 'director_sam',
            'email': 'sam@example.com',
            'password': 'password123'
        }), content_type='application/json')

        # Create published vlogs
        self.client.post('/api/vlogs', data=json.dumps({
            'title': 'Kyoto Zen Gardens at Dawn',
            'description': 'Capturing bamboo mist in Arashiyama',
            'video_path': '/media/uploads/kyoto.mp4',
            'category_id': self.cat2.id,
            'tags': ['kyoto', 'japan', 'travel']
        }), content_type='application/json')

        self.client.post('/api/vlogs', data=json.dumps({
            'title': 'Lighting Masterclass for Indie Filmmakers',
            'description': '3-point studio lighting breakdown',
            'video_path': '/media/uploads/lighting.mp4',
            'category_id': self.cat1.id,
            'tags': ['cinematography', 'lighting']
        }), content_type='application/json')

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_search_by_title_and_description(self):
        res = self.client.get('/api/search?q=Kyoto')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data['vlogs']), 1)
        self.assertEqual(data['vlogs'][0]['title'], 'Kyoto Zen Gardens at Dawn')

    def test_search_by_creator_username(self):
        res = self.client.get('/api/search?q=director_sam')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(len(data['vlogs']) >= 2)
        self.assertTrue(len(data['creators']) >= 1)

    def test_pagination_and_category_filtering(self):
        res = self.client.get('/api/vlogs?category=travel&page=1&per_page=1')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data['vlogs']), 1)
        self.assertEqual(data['total'], 1)
        self.assertEqual(data['vlogs'][0]['title'], 'Kyoto Zen Gardens at Dawn')

    def test_empty_search_results(self):
        res = self.client.get('/api/search?q=nonexistentterm123xyz')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data['vlogs']), 0)
        self.assertEqual(len(data['posts']), 0)

if __name__ == '__main__':
    unittest.main()
