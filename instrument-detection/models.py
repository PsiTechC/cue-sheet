"""
MongoDB Models for Instrument Detection Service
"""

from datetime import datetime
from pymongo import MongoClient
import os


class Database:
    """MongoDB Database connection manager"""

    _instance = None
    _client = None
    _db = None
    _connection_error = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None and self._connection_error is None:
            try:
                mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/Cue-Sheet')
                self._client = MongoClient(
                    mongo_uri,
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=5000
                )
                # Test connection
                self._client.admin.command('ping')
                # Extract database name from URI or use default
                db_name = mongo_uri.split('/')[-1].split('?')[0] if '/' in mongo_uri else 'Cue-Sheet'
                self._db = self._client[db_name]
                print(f"Connected to MongoDB: {db_name}")
            except Exception as e:
                print(f"Warning: MongoDB connection failed: {e}")
                print("Continuing without database persistence...")
                self._connection_error = str(e)
                self._client = None
                self._db = None

    @property
    def db(self):
        return self._db

    @property
    def is_connected(self):
        return self._db is not None

    def close(self):
        if self._client:
            self._client.close()


class DetectionResult:
    """Model for storing instrument detection results"""

    collection_name = 'instrumentdetections'

    def __init__(self):
        self.database = Database()
        self.db = self.database.db
        self.collection = self.db[self.collection_name] if self.db is not None else None

    def create(self, data):
        """
        Create a new detection result

        Args:
            data: Dictionary with detection data
                - job_id: Unique job identifier
                - user_id: User who requested detection
                - filename: Original video filename
                - status: Job status (queued, processing, completed, failed)
                - progress: Progress percentage (0-100)
                - options: Detection configuration options
                - results: Detection results (when completed)
                - error: Error message (when failed)
                - created_at: Creation timestamp
                - updated_at: Last update timestamp

        Returns:
            Inserted document ID or None if DB not connected
        """
        if self.collection is None:
            return None
        data['created_at'] = datetime.utcnow()
        data['updated_at'] = datetime.utcnow()
        result = self.collection.insert_one(data)
        return str(result.inserted_id)

    def find_by_job_id(self, job_id):
        """Find detection result by job ID"""
        if self.collection is None:
            return None
        return self.collection.find_one({'job_id': job_id})

    def find_by_user_id(self, user_id, limit=10):
        """Find detection results by user ID"""
        if self.collection is None:
            return []
        return list(self.collection.find(
            {'user_id': user_id}
        ).sort('created_at', -1).limit(limit))

    def update_status(self, job_id, status, progress=None, error=None):
        """Update job status"""
        if self.collection is None:
            return
        update_data = {
            'status': status,
            'updated_at': datetime.utcnow()
        }
        if progress is not None:
            update_data['progress'] = progress
        if error is not None:
            update_data['error'] = error

        self.collection.update_one(
            {'job_id': job_id},
            {'$set': update_data}
        )

    def update_results(self, job_id, results):
        """Update detection results"""
        if self.collection is None:
            return
        self.collection.update_one(
            {'job_id': job_id},
            {'$set': {
                'results': results,
                'status': 'completed',
                'progress': 100,
                'updated_at': datetime.utcnow()
            }}
        )

    def delete_by_job_id(self, job_id):
        """Delete detection result by job ID"""
        if self.collection is None:
            return None
        return self.collection.delete_one({'job_id': job_id})

    def cleanup_old_records(self, days=7):
        """Delete records older than specified days"""
        if self.collection is None:
            return 0
        from datetime import timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        result = self.collection.delete_many({
            'created_at': {'$lt': cutoff_date}
        })
        return result.deleted_count


class UserMinutes:
    """Model for tracking user minutes usage"""

    collection_name = 'userminutes'

    def __init__(self):
        self.database = Database()
        self.db = self.database.db
        self.collection = self.db[self.collection_name] if self.db is not None else None

    def find_by_user_id(self, user_id):
        """Find user minutes record"""
        if self.collection is None:
            return None
        return self.collection.find_one({'userId': user_id})

    def deduct_minutes(self, user_id, minutes_used):
        """
        Deduct minutes from user's balance

        Args:
            user_id: User identifier
            minutes_used: Number of minutes to deduct

        Returns:
            Boolean indicating success
        """
        if self.collection is None:
            return True  # Allow operation to proceed if DB is not available

        user_record = self.find_by_user_id(user_id)

        if not user_record:
            return False

        minutes_used_total = user_record.get('minutesUsed', 0)
        seconds_used = user_record.get('secondsUsed', 0)

        # Convert minutes to seconds and add
        total_seconds_used = seconds_used + (minutes_used * 60)
        new_minutes_used = minutes_used_total + minutes_used

        self.collection.update_one(
            {'userId': user_id},
            {'$set': {
                'minutesUsed': new_minutes_used,
                'secondsUsed': total_seconds_used,
                'recordedAt': datetime.utcnow()
            }}
        )

        return True

    def check_balance(self, user_id, required_minutes):
        """
        Check if user has sufficient balance

        Args:
            user_id: User identifier
            required_minutes: Minutes required for operation

        Returns:
            Boolean indicating if user has sufficient balance
        """
        user_record = self.find_by_user_id(user_id)

        if not user_record:
            return False

        total_minutes = user_record.get('totalMinutes', 0)
        minutes_used = user_record.get('minutesUsed', 0)
        balance = total_minutes - minutes_used

        return balance >= required_minutes
