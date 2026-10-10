from sqlalchemy import Engine

from app.database.database import engine
from app.lifts.constants import UINT32_MAX


def migrate_lift_weights(db_engine: Engine = engine) -> None:
    if db_engine.dialect.name != "sqlite":
        return

    with db_engine.begin() as connection:
        columns = connection.exec_driver_sql("PRAGMA table_info(lifts)").fetchall()
        weight_column = next((column for column in columns if column[1] == "weight"), None)
        if weight_column is None or weight_column[2].upper() == "INTEGER":
            return

        connection.exec_driver_sql(
            f"""CREATE TABLE lifts_new (
                id INTEGER NOT NULL PRIMARY KEY,
                post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                exercise_name VARCHAR(100) NOT NULL,
                weight INTEGER NOT NULL CHECK (weight >= 0 AND weight <= {UINT32_MAX}),
                unit VARCHAR(2) NOT NULL,
                reps INTEGER NOT NULL
            )"""
        )
        connection.exec_driver_sql(
            """INSERT INTO lifts_new (id, post_id, exercise_name, weight, unit, reps)
               SELECT id, post_id, exercise_name, CAST(ROUND(weight) AS INTEGER), unit, reps
               FROM lifts"""
        )
        connection.exec_driver_sql("DROP TABLE lifts")
        connection.exec_driver_sql("ALTER TABLE lifts_new RENAME TO lifts")
        connection.exec_driver_sql("CREATE INDEX ix_lifts_post_id ON lifts (post_id)")


def migrate_post_activity(db_engine: Engine = engine) -> None:
    if db_engine.dialect.name not in {"sqlite", "postgresql"}:
        return

    activity_columns = {
        "activity_name": "VARCHAR(100)",
        "distance": "FLOAT",
        "distance_unit": "VARCHAR(2)",
        "duration_seconds": "INTEGER",
        "pace_seconds_per_unit": "FLOAT",
    }
    with db_engine.begin() as connection:
        if db_engine.dialect.name == "postgresql":
            postgres_types = {
                "activity_name": "VARCHAR(100)",
                "distance": "DOUBLE PRECISION",
                "distance_unit": "VARCHAR(2)",
                "duration_seconds": "INTEGER",
                "pace_seconds_per_unit": "DOUBLE PRECISION",
            }
            for name, column_type in postgres_types.items():
                connection.exec_driver_sql(
                    f"ALTER TABLE posts ADD COLUMN IF NOT EXISTS {name} {column_type}"
                )
            return

        columns = {column[1] for column in connection.exec_driver_sql("PRAGMA table_info(posts)").fetchall()}
        for name, column_type in activity_columns.items():
            if name not in columns:
                connection.exec_driver_sql(f"ALTER TABLE posts ADD COLUMN {name} {column_type}")


def migrate_user_profile_image(db_engine: Engine = engine) -> None:
    if db_engine.dialect.name not in {"sqlite", "postgresql"}:
        return

    with db_engine.begin() as connection:
        if db_engine.dialect.name == "postgresql":
            connection.exec_driver_sql(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255)"
            )
            return

        columns = {column[1] for column in connection.exec_driver_sql("PRAGMA table_info(users)").fetchall()}
        if "profile_image" not in columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN profile_image VARCHAR(255)")