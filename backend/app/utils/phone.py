import re
from typing import Optional


def normalize_indian_phone(phone: Optional[str]) -> Optional[str]:
    """
    Normalizes an Indian phone number to standard formatted string '+91 XXXXX XXXXX'
    or standard E.164-compatible '+91XXXXXXXXXX'.
    Supports inputs like:
      - '9876543210'
      - '+919876543210'
      - '+91 98765 43210'
      - '09876543210'
      - '91 9876543210'
    """
    if not phone or not phone.strip():
        return None

    raw = phone.strip()
    digits = re.sub(r"\D", "", raw)

    # 10 digits without country code
    if len(digits) == 10:
        return f"+91 {digits[:5]} {digits[5:]}"

    # 11 digits starting with 0
    if len(digits) == 11 and digits.startswith("0"):
        ten = digits[1:]
        return f"+91 {ten[:5]} {ten[5:]}"

    # 12 digits starting with 91
    if len(digits) == 12 and digits.startswith("91"):
        ten = digits[2:]
        return f"+91 {ten[:5]} {ten[5:]}"

    # Non-standard or international number - preserve with cleaned spacing if has leading plus
    if raw.startswith("+"):
        return raw
    return f"+{raw}" if digits else None


def format_dial_phone(phone: Optional[str]) -> Optional[str]:
    """Returns digits formatted for tel: URI, e.g. '+919876543210'"""
    if not phone:
        return None
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 10:
        return f"+91{digits}"
    if len(digits) == 11 and digits.startswith("0"):
        return f"+91{digits[1:]}"
    if len(digits) == 12 and digits.startswith("91"):
        return f"+{digits}"
    if phone.strip().startswith("+"):
        return f"+{digits}"
    return f"+{digits}" if digits else None
