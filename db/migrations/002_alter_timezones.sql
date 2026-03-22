ALTER TABLE AuthToken
  ALTER COLUMN Created_DtTm TYPE timestamptz
  USING Created_DtTm AT TIME ZONE 'UTC';

ALTER TABLE Cookbook
  ALTER COLUMN Created_DtTm TYPE timestamptz
  USING Created_DtTm AT TIME ZONE 'UTC';

ALTER TABLE Cookbook_Users
  ALTER COLUMN Added_DtTm TYPE timestamptz
  USING Added_DtTm AT TIME ZONE 'UTC';

ALTER TABLE Recipe
  ALTER COLUMN Modified_DtTm TYPE timestamptz
  USING Modified_DtTm AT TIME ZONE 'UTC';
