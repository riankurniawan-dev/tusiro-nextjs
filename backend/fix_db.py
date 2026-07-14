from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    # Show current indexes on api_key
    rows = conn.execute(text("SHOW INDEX FROM stations WHERE Column_name = 'api_key'")).fetchall()
    print("Current indexes on api_key:", rows)
    
    for row in rows:
        index_name = row[2]  # Key_name is the 3rd column
        if row[1] == 0:  # Non_unique = 0 means it IS unique
            print(f"Dropping unique index: {index_name}")
            conn.execute(text(f"DROP INDEX `{index_name}` ON stations"))
            conn.commit()
            print("Done!")
    
    # Re-create as non-unique index
    try:
        conn.execute(text("CREATE INDEX ix_stations_api_key ON stations (api_key)"))
        conn.commit()
        print("Re-created non-unique index on api_key")
    except Exception as e:
        print(f"Index already exists or error: {e}")

    # Verify
    rows = conn.execute(text("SHOW INDEX FROM stations WHERE Column_name = 'api_key'")).fetchall()
    print("Final indexes on api_key:", rows)
