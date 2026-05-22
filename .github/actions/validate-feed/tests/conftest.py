"""Make the action's entrypoint and the vendored feedvalidator importable."""
import sys
from pathlib import Path

ACTION_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ACTION_ROOT))
sys.path.insert(0, str(ACTION_ROOT / "vendor" / "feedvalidator" / "src"))
