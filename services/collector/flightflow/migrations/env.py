"""Alembic environment. The database URL comes from FlightFlow's own configuration."""

from alembic import context

from flightflow.db import get_engine, metadata

config = context.config


def run_migrations_online() -> None:
    connectable = config.attributes.get("connection")
    if connectable is not None:
        context.configure(connection=connectable, target_metadata=metadata, render_as_batch=True)
        with context.begin_transaction():
            context.run_migrations()
        return
    with get_engine().connect() as connection:
        context.configure(connection=connection, target_metadata=metadata, render_as_batch=True)
        with context.begin_transaction():
            context.run_migrations()


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"), target_metadata=metadata, literal_binds=True
    )
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
