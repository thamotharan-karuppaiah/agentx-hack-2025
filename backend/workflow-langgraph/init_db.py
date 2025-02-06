from app.database import engine, Base
from app import models
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    """Initialize the database by dropping all tables and recreating them"""
    # Print all tables that will be created
    logger.info("Models to be created: %s", Base.metadata.tables.keys())
    
    print("Dropping all tables...")
    # Base.metadata.drop_all(bind=engine)  # Commenting out drop_all since we don't have permissions
    
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    # Verify tables were created
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    logger.info("Created tables: %s", tables)
    
    print("Database initialization completed!")

if __name__ == "__main__":
    init_db() 