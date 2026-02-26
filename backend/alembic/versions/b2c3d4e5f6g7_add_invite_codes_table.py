"""add_invite_codes_table

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-02-26 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6g7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create invite_codes table
    op.create_table(
        'invite_codes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=8), nullable=False),
        sa.Column('complex_id', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['complex_id'], ['residential_complexes.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_invite_codes_id'), 'invite_codes', ['id'], unique=False)
    op.create_index(op.f('ix_invite_codes_code'), 'invite_codes', ['code'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_invite_codes_code'), table_name='invite_codes')
    op.drop_index(op.f('ix_invite_codes_id'), table_name='invite_codes')
    op.drop_table('invite_codes')
