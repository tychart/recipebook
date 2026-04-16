import os
import sys
from pathlib import Path


SERVER_ROOT = Path(__file__).resolve().parents[1]

if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))

os.environ.setdefault("IMAGE_EXTRACTION_MODEL", "qwen3-vl:4b")
os.environ.setdefault("TEXT_EXTRACTION_MODEL", "qwen3:4b")
os.environ.setdefault("STRUCTURE_MODEL", "qwen3:4b")
