from sqlalchemy import create_engine, MetaData, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from .config import settings
import json

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Create a metadata instance without schema specification
metadata = MetaData()

# Configure the engine with proper connection pooling
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_pre_ping=True,
    pool_recycle=1800,
    poolclass=QueuePool,  # Explicitly set pool class
    json_serializer=lambda obj: json.dumps(obj, default=str)
)

@event.listens_for(engine, 'connect')
def set_search_path(dbapi_connection, connection_record):
    """Set the search path and ensure proper permissions on connection"""
    cursor = dbapi_connection.cursor()
    cursor.execute("SET search_path TO public")
    cursor.execute("ALTER DATABASE workflow_db OWNER TO postgres")
    cursor.close()

# Configure session with proper settings
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

# Create declarative base
Base = declarative_base(metadata=metadata)

def get_db():
    """Get a database session with proper error handling"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        print(f"Database error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

def init_db():
    """Initialize the database by creating all tables"""
    try:
        # Dispose existing connections
        engine.dispose()
        
        # Create a new connection and set up permissions
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        # Set ownership of newly created tables
        with engine.connect() as conn:
            conn.commit()
            
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        raise 