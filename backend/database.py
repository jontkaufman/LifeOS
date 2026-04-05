from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        yield session


async def init_db():
    from models import profile, coaching, goals, reviews, chat, coaching_notes, settings  # noqa
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Fix columns that were created NOT NULL but should be nullable
        await _migrate_nullable(conn, "reviews", "week_id")
        # Add new life_areas columns for rich area capture
        for col in ("goals", "challenges", "success_vision", "additional_context"):
            await _add_column_if_missing(conn, "life_areas", col, "TEXT DEFAULT ''")


async def _add_column_if_missing(conn, table: str, column: str, col_type: str):
    """Add a column to a table if it doesn't already exist."""
    from sqlalchemy import text
    result = await conn.execute(text(f"PRAGMA table_info({table})"))
    existing = {row[1] for row in result.fetchall()}
    if column not in existing:
        await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))


async def _migrate_nullable(conn, table: str, column: str):
    """SQLite doesn't support ALTER COLUMN, so recreate if needed."""
    from sqlalchemy import text
    result = await conn.execute(text(f"PRAGMA table_info({table})"))
    rows = result.fetchall()
    for row in rows:
        # PRAGMA table_info columns: cid, name, type, notnull, dflt_value, pk
        if row[1] == column and row[3] == 1:  # notnull == 1 means NOT NULL
            await conn.execute(text(
                f"ALTER TABLE {table} RENAME TO _{table}_old"
            ))
            await conn.run_sync(Base.metadata.tables[table].create)
            # Copy data from old table
            cols = [r[1] for r in rows]
            col_list = ", ".join(cols)
            await conn.execute(text(
                f"INSERT INTO {table} ({col_list}) SELECT {col_list} FROM _{table}_old"
            ))
            await conn.execute(text(f"DROP TABLE _{table}_old"))
            break
