# number formatters - mostly for numeric questions
# copy of number_formatters.ts and should be kept in sync


def to_scientific_notation(
    val: float, sigfigs: int, leading_numbers: int = 1, trailing_zeros: bool = True
) -> str:
    import math

    if val == 0:
        return "0"

    pow = math.floor(math.log10(abs(val))) - leading_numbers + 1
    mantissa = round(val / (10**pow), max(0, sigfigs - leading_numbers))

    if not trailing_zeros:
        mantissa_str = f"{mantissa:.{max(0, sigfigs - leading_numbers)}f}".rstrip(
            "0"
        ).rstrip(".")
    else:
        mantissa_str = f"{mantissa:.{max(0, sigfigs - leading_numbers)}f}"

    if pow != 0:
        return f"{mantissa_str}e{pow}"
    return mantissa_str


def abbreviated_number(
    val: float, sigfigs: int = 3, trailing_zeros: bool = False
) -> str:
    import math

    if val == 0:
        return "0"

    pow = math.floor(math.log10(abs(val)))

    if -3 <= pow < 3:
        return f"{val:.{sigfigs}g}"

    if pow >= 12:
        return to_scientific_notation(val, 2, 1, False)

    suffix = ""
    leading_numbers = 1

    if pow >= 9:
        suffix = "B"
        val /= 1e9
        leading_numbers = pow - 8
    elif pow >= 6:
        suffix = "M"
        val /= 1e6
        leading_numbers = pow - 5
    elif pow >= 3:
        suffix = "k"
        val /= 1e3
        leading_numbers = pow - 2
    elif pow >= 0:
        leading_numbers = pow + 1

    return (
        to_scientific_notation(val, sigfigs, leading_numbers, trailing_zeros) + suffix
    )


def format_value_unit(value, unit):
    if not unit:
        return value

    return f"{value}%" if unit == "%" else f"{value} {unit}"
