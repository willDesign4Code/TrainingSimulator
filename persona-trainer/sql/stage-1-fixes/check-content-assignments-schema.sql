-- Check the current schema of content_assignments table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_name = 'content_assignments'
    AND table_schema = 'public'
ORDER BY
    ordinal_position;
