from typing import Self, Union

from rest_framework import serializers


def parse_order_by(value: str) -> tuple[bool, str]:
    """
    Returns (is_desc, field)
    """

    return value.startswith("-"), value.lstrip("-")


def parse_key_lookup(value: str) -> tuple[str, str | None]:
    """
    Parses key lookups like field__lookup
    """

    chunks = value.split("__")

    if len(chunks) != 2:
        return value, None

    return chunks[0], chunks[1]


class SerializerKeyLookupMixin:
    """
    A mixin that allows serializers to handle fields with dynamic suffixes,
    applying the base field's validation to them.
    """

    key_lookup_fields: list[str] = []
    key_lookup_expressions = ["gt", "gte", "lt", "lte"]

    def to_internal_value(self: Union[serializers.Serializer, Self], data):
        # Default processing
        ret = super().to_internal_value(data)
        errors = {}

        for key, value in data.items():
            if key in self.fields:
                continue

            field_name, lookup = parse_key_lookup(key)

            if field_name not in self.key_lookup_fields:
                continue

            if lookup not in self.key_lookup_expressions:
                errors[key] = "Not a valid field key lookup"

            try:
                base_field = self.fields[field_name]
                validated_value = base_field.run_validation(value)
                ret[key] = validated_value
            except serializers.ValidationError as exc:
                errors[key] = exc.detail

        if errors:
            raise serializers.ValidationError(errors)
        return ret
