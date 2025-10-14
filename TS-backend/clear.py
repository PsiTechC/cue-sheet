import os
import shutil
import schedule
import time
from datetime import datetime

# Define the base folder paths
FOLDERS_TO_CLEAR = ["TS"]

def clear_folders():
    """Function to clear folders"""
    try:
        print(f"Task started at {datetime.now()} - Clearing folders...")
        for folder in FOLDERS_TO_CLEAR:
            folder_path = os.path.join(folder)
            
            # Check if the folder exists
            if os.path.exists(folder_path):
                for subfolder in os.listdir(folder_path):
                    subfolder_path = os.path.join(folder_path, subfolder)
                    
                    # Clear only directories
                    if os.path.isdir(subfolder_path):
                        shutil.rmtree(subfolder_path)
                        print(f"Cleared folder: {subfolder_path}")
            else:
                print(f"Folder not found: {folder_path}")

        print(f"Task completed at {datetime.now()} - All specified folders are cleared.")
    except Exception as e:
        print(f"Error clearing folders: {e}")

def start_scheduler():
    """Function to start the scheduler"""
    schedule.every().day.at("03:00").do(clear_folders)

    print("Scheduler started. Waiting for the scheduled time...")
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    start_scheduler()
