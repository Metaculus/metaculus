from django.db.backends.postgresql import compiler


class SQLCompiler(compiler.SQLCompiler):
    def get_default_columns(self, select_mask, *args, **kwargs):
        columns = super().get_default_columns(select_mask, *args, **kwargs)
        _, defer = self.query.deferred_loading

        return [
            column
            for column in columns
            if not getattr(column.target, "deferred_by_default", False)
            # Named in only()
            or (not defer and column.target in select_mask)
        ]


def __getattr__(name):
    # Django looks up every compiler class by name in this module
    return getattr(compiler, name)
