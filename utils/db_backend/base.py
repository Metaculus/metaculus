from django.db.backends.postgresql import base, operations


class DatabaseOperations(operations.DatabaseOperations):
    compiler_module = "utils.db_backend.compiler"


class DatabaseWrapper(base.DatabaseWrapper):
    ops_class = DatabaseOperations
