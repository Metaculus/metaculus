def parse_order_by(value: str) -> tuple[bool, str]:
    """
    Returns (is_desc, field)
    """

    return value.startswith("-"), value.lstrip("-")
