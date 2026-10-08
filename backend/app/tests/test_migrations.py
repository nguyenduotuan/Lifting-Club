from sqlalchemy import create_engine, inspect

from app.database.migrations import migrate_lift_weights


def test_legacy_float_weights_migrate_to_integer_without_losing_posts(tmp_path):
    legacy_engine = create_engine(f"sqlite:///{tmp_path / 'legacy.db'}")
    with legacy_engine.begin() as connection:
        connection.exec_driver_sql("CREATE TABLE posts (id INTEGER PRIMARY KEY)")
        connection.exec_driver_sql(
            """CREATE TABLE lifts (
                id INTEGER PRIMARY KEY,
                post_id INTEGER NOT NULL,
                exercise_name VARCHAR(100) NOT NULL,
                weight FLOAT NOT NULL,
                unit VARCHAR(2) NOT NULL,
                reps INTEGER NOT NULL
            )"""
        )
        connection.exec_driver_sql("INSERT INTO posts (id) VALUES (1)")
        connection.exec_driver_sql(
            "INSERT INTO lifts VALUES (1, 1, 'Deadlift', 399.6, 'kg', 1)"
        )

    migrate_lift_weights(legacy_engine)

    columns = inspect(legacy_engine).get_columns("lifts")
    assert str(next(column["type"] for column in columns if column["name"] == "weight")).upper() == "INTEGER"
    with legacy_engine.connect() as connection:
        assert connection.exec_driver_sql("SELECT weight FROM lifts WHERE id = 1").scalar_one() == 400
        assert connection.exec_driver_sql("SELECT id FROM posts").scalar_one() == 1
    legacy_engine.dispose()