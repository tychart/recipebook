import logging
import os
import sys


_LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s %(message)s"
_DEFAULT_LEVEL = "INFO"


def _get_log_level() -> int:
    level_name = os.getenv("LOG_LEVEL", _DEFAULT_LEVEL).upper()
    return getattr(logging, level_name, logging.INFO)


def configure_logging() -> None:
    root_logger = logging.getLogger()

    if root_logger.handlers:
        root_logger.setLevel(_get_log_level())
        return

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(_LOG_FORMAT))

    root_logger.setLevel(_get_log_level())
    root_logger.addHandler(handler)

