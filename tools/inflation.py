"""
inflation.py — Historical Currency Inflation Converter

Converts historical USD values to modern purchasing power using
Consumer Price Index (CPI) data from the Bureau of Labor Statistics.

Usage:
    from inflation import convert_to_modern, get_multiplier
    
    # Convert $25.00 in 1963 to 2026 dollars
    modern = convert_to_modern(25.00, 1963)
    print(f"$25.00 in 1963 = ${modern:.2f} in 2026")
    
    # Get the multiplier for a year
    mult = get_multiplier(1963)
    print(f"1963 → 2026 multiplier: {mult:.2f}x")
"""

import json
import os
from typing import Optional
from dataclasses import dataclass

# Load CPI data from JSON file
_CPI_DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), 
    "data", 
    "cpi_annual.json"
)

_CPI_CACHE: Optional[dict] = None


def _load_cpi_data() -> dict:
    """Load CPI data from JSON file (cached)."""
    global _CPI_CACHE
    
    if _CPI_CACHE is not None:
        return _CPI_CACHE
    
    try:
        with open(_CPI_DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            _CPI_CACHE = {int(k): v for k, v in data["data"].items()}
            return _CPI_CACHE
    except FileNotFoundError:
        raise RuntimeError(f"CPI data file not found: {_CPI_DATA_PATH}")
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Invalid CPI data file: {e}")


@dataclass
class InflationResult:
    """Result of an inflation conversion."""
    original_amount: float
    original_year: int
    converted_amount: float
    target_year: int
    multiplier: float
    original_cpi: float
    target_cpi: float
    
    def to_dict(self) -> dict:
        return {
            "original_amount": self.original_amount,
            "original_year": self.original_year,
            "converted_amount": round(self.converted_amount, 2),
            "target_year": self.target_year,
            "multiplier": round(self.multiplier, 2),
            "original_cpi": self.original_cpi,
            "target_cpi": self.target_cpi,
            "formatted": f"${self.original_amount:.2f} ({self.original_year}) = ${self.converted_amount:.2f} ({self.target_year})"
        }


def get_available_years() -> tuple[int, int]:
    """Return the range of years available in CPI data."""
    cpi = _load_cpi_data()
    years = sorted(cpi.keys())
    return (years[0], years[-1])


def get_cpi(year: int) -> Optional[float]:
    """Get CPI value for a specific year."""
    cpi = _load_cpi_data()
    return cpi.get(year)


def get_multiplier(source_year: int, target_year: int = 2026) -> Optional[float]:
    """
    Get the inflation multiplier between two years.
    
    Args:
        source_year: The historical year
        target_year: The target year (default: 2026)
        
    Returns:
        Multiplier value, or None if years not in range
    """
    cpi = _load_cpi_data()
    
    source_cpi = cpi.get(source_year)
    target_cpi = cpi.get(target_year)
    
    if source_cpi is None or target_cpi is None:
        return None
    
    return target_cpi / source_cpi


def convert_to_modern(
    amount: float, 
    source_year: int, 
    target_year: int = 2026
) -> Optional[float]:
    """
    Convert a historical dollar amount to target year purchasing power.
    
    Args:
        amount: Dollar amount in source_year dollars
        source_year: The year of the original amount
        target_year: The year to convert to (default: 2026)
        
    Returns:
        Converted amount, or None if years not in CPI range
        
    Example:
        >>> convert_to_modern(25.00, 1963)
        264.71  # Approximately
    """
    multiplier = get_multiplier(source_year, target_year)
    if multiplier is None:
        return None
    return amount * multiplier


def convert_detailed(
    amount: float,
    source_year: int,
    target_year: int = 2026
) -> Optional[InflationResult]:
    """
    Convert with full details including CPI values and multiplier.
    
    Args:
        amount: Dollar amount in source_year dollars
        source_year: The year of the original amount
        target_year: The year to convert to (default: 2026)
        
    Returns:
        InflationResult with all conversion details, or None if years invalid
    """
    cpi = _load_cpi_data()
    
    source_cpi = cpi.get(source_year)
    target_cpi = cpi.get(target_year)
    
    if source_cpi is None or target_cpi is None:
        return None
    
    multiplier = target_cpi / source_cpi
    converted = amount * multiplier
    
    return InflationResult(
        original_amount=amount,
        original_year=source_year,
        converted_amount=converted,
        target_year=target_year,
        multiplier=multiplier,
        original_cpi=source_cpi,
        target_cpi=target_cpi,
    )


# =============================================================================
# CONVENIENCE FORMATTING
# =============================================================================

def format_conversion(amount: float, source_year: int, target_year: int = 2026) -> str:
    """
    Return a formatted string showing the conversion.
    
    Example:
        >>> format_conversion(25.00, 1963)
        "$25.00 (1963) = $264.71 (2026)"
    """
    converted = convert_to_modern(amount, source_year, target_year)
    if converted is None:
        return f"${amount:.2f} ({source_year}) - conversion unavailable"
    return f"${amount:.2f} ({source_year}) = ${converted:.2f} ({target_year})"


# =============================================================================
# CLI TESTING
# =============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("Inflation Converter — Test Suite")
    print("=" * 60)
    
    # Test conversions for JFK era
    test_cases = [
        (25.00, 1963, "Rifle cost"),
        (0.30, 1963, "Gallon of gas"),
        (1.00, 1963, "One dollar"),
        (100.00, 1963, "Weekly salary"),
        (3500.00, 1963, "Car price"),
        (15000.00, 1963, "House price"),
    ]
    
    print(f"\nCPI Data Range: {get_available_years()}")
    print(f"1963 CPI: {get_cpi(1963)}")
    print(f"2026 CPI: {get_cpi(2026)}")
    print(f"1963->2026 Multiplier: {get_multiplier(1963):.2f}x")
    
    print("\n" + "-" * 60)
    print("JFK Era (1963) → Modern (2026) Conversions:")
    print("-" * 60)
    
    for amount, year, description in test_cases:
        result = convert_detailed(amount, year)
        if result:
            print(f"  {description:20} | {result.to_dict()['formatted']}")
    
    print("\n" + "-" * 60)
    print("Detailed conversion example:")
    print("-" * 60)
    result = convert_detailed(25.00, 1963)
    if result:
        import json
        print(json.dumps(result.to_dict(), indent=2))
