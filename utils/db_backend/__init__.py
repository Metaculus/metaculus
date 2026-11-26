def deferred_by_default(field):
    """
    Keeps a model field out of every default SELECT, joins included.
    Its model needs DeferredByDefaultMixin.
    """

    field.deferred_by_default = True

    return field


class DeferredByDefaultMixin:
    def refresh_from_db(self, using=None, fields=None, from_queryset=None):
        # Otherwise a full refresh skips deferred-by-default fields, leaving stale values
        if fields is None and not self.get_deferred_fields():
            if from_queryset is None:
                from_queryset = self.__class__._base_manager.db_manager(
                    using, hints={"instance": self}
                )
            from_queryset = from_queryset.only(
                *(field.attname for field in self._meta.concrete_fields)
            )

        super().refresh_from_db(using, fields, from_queryset)
