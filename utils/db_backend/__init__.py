def deferred_by_default(field):
    """
    Keeps a model field out of every default SELECT, joins included
    """

    field.deferred_by_default = True

    return field
