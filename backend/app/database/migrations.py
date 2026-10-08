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