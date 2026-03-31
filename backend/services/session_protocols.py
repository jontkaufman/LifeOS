from presets.chat_protocols import CHAT_MODES, CLOSING_PROTOCOL


def get_opening_message(mode: str) -> str:
    config = CHAT_MODES.get(mode, CHAT_MODES["open"])
    return config["opening"]


def get_closing_prompt(mode: str) -> str:
    return CLOSING_PROTOCOL
