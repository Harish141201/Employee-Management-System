-- Index on leave_requests.status — queried by the dashboard's
-- pending-count, the "All Requests" status filter, and the overlap check
-- on every new leave application. Not auto-indexed the way FK columns
-- are, since it isn't one.
--
-- A guard against re-creating the index on a retry matters here specifically:
-- MySQL commits each DDL statement immediately rather than rolling back the
-- whole script on a later failure, so a previous failed run of this
-- migration may already have created this index. Without this guard, a
-- retry would fail with "index already exists" instead of succeeding.
--
-- MySQL (unlike MariaDB/Postgres) does not support the
-- "CREATE INDEX IF NOT EXISTS" clause at all, so the guard has to be done
-- manually: check information_schema for the index, and only run the
-- CREATE INDEX if it isn't already there.
--
-- employees.status is deliberately NOT indexed here yet — that column is
-- created by Hibernate (ddl-auto=update), which runs AFTER Flyway on
-- every startup, so it doesn't exist yet on a database that hasn't had a
-- successful startup since that field was added. Indexing it is a clean
-- follow-up migration once that's confirmed to exist.
--
-- leave_requests itself has the exact same chicken-and-egg problem on a
-- brand-new database: Hibernate (ddl-auto=update) is what creates this
-- table in the first place, and it runs AFTER Flyway on every startup. So
-- on the very first startup against a fresh database, this table doesn't
-- exist yet either when this migration runs. Guard on the table's
-- existence too, not just the index's, and no-op if it's not there yet —
-- the index will simply be picked up on the NEXT startup, once Hibernate
-- has had a chance to create the table.
SET @table_exists = (
    SELECT COUNT(1)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'leave_requests'
);

SET @index_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'leave_requests'
      AND index_name = 'idx_leave_requests_status'
);

SET @create_index_sql = IF(
    @table_exists = 1 AND @index_exists = 0,
    'CREATE INDEX idx_leave_requests_status ON leave_requests(status)',
    'SELECT 1'
);

PREPARE stmt FROM @create_index_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
