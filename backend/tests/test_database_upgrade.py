from pathlib import Path

import pytest
from sqlalchemy import create_engine, inspect, text

from app.database import Base, create_database_tables


def test_checkout_table_is_added_to_existing_database(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    engine = create_engine(f"sqlite:///{tmp_path / 'existing.db'}")
    old_tables = [
        table for table in Base.metadata.sorted_tables if table.name != "checkout_attempts"
    ]
    Base.metadata.create_all(engine, tables=old_tables)
    with engine.begin() as connection:
        connection.execute(text(
            "INSERT INTO categories (name, slug, description) "
            "VALUES ('Existing', 'existing', 'Preserved')"
        ))

    monkeypatch.setattr("app.database.engine", engine)
    create_database_tables()

    assert "checkout_attempts" in inspect(engine).get_table_names()
    with engine.connect() as connection:
        assert connection.scalar(text("SELECT name FROM categories")) == "Existing"
    engine.dispose()
