import logging

logger = logging.getLogger(__name__)


def convert_slider_values_to_distribution_input(values: dict) -> dict:
    """
    Converts old `Forecast.slider_value` numeric/date questions to `Forecast.distribution_input`
    """

    logger.info(
        "Triggered backward compatibility of convert_slider_values_to_distribution_input"
    )

    distribution_input = {"type": "slider", "components": []}

    for idx, forecast in enumerate(values.get("forecast")):
        weight = values["weights"][idx]

        distribution_input["components"].append(
            {
                "weight": weight,
                "left": forecast["left"],
                "right": forecast["right"],
                "center": forecast["center"],
            }
        )

    return distribution_input
