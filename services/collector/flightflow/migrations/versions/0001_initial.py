"""Initial schema: positions, flights_summary, daily_stats.

Matches the schema of existing FlightFlow installations (the original DDL plus the
aircraft_type columns), so those databases can be adopted with ``flightflow db stamp``.

Revision ID: 0001
Revises:
Create Date: 2026-11-12
"""

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

BigId = sa.BigInteger().with_variant(sa.Integer(), "sqlite")


def upgrade() -> None:
    op.create_table(
        "positions",
        sa.Column("id", BigId, primary_key=True, autoincrement=True),
        sa.Column("ts", sa.DateTime(timezone=True), nullable=False),
        sa.Column("hex", sa.String(6)),
        sa.Column("type", sa.String(16)),
        sa.Column("flight", sa.String(10)),
        sa.Column("reg", sa.String(10)),
        sa.Column("aircraft_type", sa.String(10)),
        sa.Column("squawk", sa.String(4)),
        sa.Column("category", sa.String(4)),
        sa.Column("lat", sa.Float),
        sa.Column("lon", sa.Float),
        sa.Column("distance_km", sa.Float),
        sa.Column("nic", sa.SmallInteger),
        sa.Column("rc", sa.Float),
        sa.Column("seen_pos", sa.Float),
        sa.Column("alt_baro", sa.Integer),
        sa.Column("alt_geom", sa.Integer),
        sa.Column("baro_rate", sa.Integer),
        sa.Column("geom_rate", sa.Integer),
        sa.Column("gs", sa.Float),
        sa.Column("ias", sa.Integer),
        sa.Column("tas", sa.Integer),
        sa.Column("mach", sa.Float),
        sa.Column("track", sa.Float),
        sa.Column("track_rate", sa.Float),
        sa.Column("roll", sa.Float),
        sa.Column("mag_heading", sa.Float),
        sa.Column("true_heading", sa.Float),
        sa.Column("wd", sa.Integer),
        sa.Column("ws", sa.Integer),
        sa.Column("oat", sa.Integer),
        sa.Column("tat", sa.Integer),
        sa.Column("nav_qnh", sa.Float),
        sa.Column("nav_altitude_mcp", sa.Integer),
        sa.Column("rssi", sa.Float),
        sa.Column("messages", sa.BigInteger),
    )
    op.create_index("idx_positions_ts", "positions", ["ts"])
    op.create_index("idx_positions_hex", "positions", ["hex"])

    op.create_table(
        "flights_summary",
        sa.Column("id", BigId, primary_key=True, autoincrement=True),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("hex", sa.String(6)),
        sa.Column("flight", sa.String(10)),
        sa.Column("reg", sa.String(10)),
        sa.Column("type", sa.String(16)),
        sa.Column("category", sa.String(4)),
        sa.Column("aircraft_type", sa.String(10)),
        sa.Column("first_seen", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen", sa.DateTime(timezone=True), nullable=False),
        sa.Column("detection_count", sa.Integer, nullable=False),
        sa.Column("avg_lat", sa.Float),
        sa.Column("avg_lon", sa.Float),
        sa.Column("min_distance_km", sa.Float),
        sa.Column("max_distance_km", sa.Float),
        sa.Column("min_alt_baro", sa.Integer),
        sa.Column("max_alt_baro", sa.Integer),
        sa.Column("avg_gs", sa.Float),
        sa.Column("max_gs", sa.Float),
        sa.Column("avg_rssi", sa.Float),
    )
    op.create_index("idx_flights_summary_date", "flights_summary", ["date"])
    op.create_index("idx_flights_summary_date_hex", "flights_summary", ["date", "hex"])
    op.create_index("idx_flights_summary_aircraft_type", "flights_summary", ["aircraft_type"])

    op.create_table(
        "daily_stats",
        sa.Column("date", sa.Date, primary_key=True),
        sa.Column("unique_aircraft", sa.Integer, nullable=False),
        sa.Column("total_positions", sa.Integer, nullable=False),
        sa.Column("busiest_hour", sa.SmallInteger),
        sa.Column("avg_distance_km", sa.Float),
        sa.Column("max_distance_km", sa.Float),
        sa.Column("most_common_type", sa.String(16)),
    )


def downgrade() -> None:
    op.drop_table("daily_stats")
    op.drop_table("flights_summary")
    op.drop_table("positions")
