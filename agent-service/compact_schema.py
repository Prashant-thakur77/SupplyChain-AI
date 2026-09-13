"""Field→type one-liners for prompts: the information of model_json_schema() at ~10× fewer tokens (free-tier TPM limits)."""
from __future__ import annotations

import enum
import typing

from pydantic import BaseModel


def _t(ann, depth: int) -> str:
    origin = typing.get_origin(ann)
    if origin is typing.Union or str(origin) == "<class 'types.UnionType'>":
        args = [a for a in typing.get_args(ann) if a is not type(None)]
        return _t(args[0], depth) + "|null" if args else "null"
    if origin is list:
        (a,) = typing.get_args(ann) or (typing.Any,)
        return f"[{_t(a, depth)}]"
    if origin is dict:
        return "object"
    if origin is typing.Literal:
        return "|".join(repr(v) for v in typing.get_args(ann))
    if isinstance(ann, type) and issubclass(ann, enum.Enum):
        return "|".join(repr(m.value) for m in ann)
    if isinstance(ann, type) and issubclass(ann, BaseModel):
        return compact_schema(ann, depth + 1) if depth < 3 else ann.__name__
    return getattr(ann, "__name__", str(ann)).replace("typing.", "")


def compact_schema(model: type[BaseModel], depth: int = 0) -> str:
    parts = []
    for name, f in model.model_fields.items():
        desc = f"  // {f.description}" if getattr(f, "description", None) else ""
        parts.append(f'"{name}": {_t(f.annotation, depth)}{desc}')
    sep = ", " if depth else ",\n  "
    return "{" + ("" if depth else "\n  ") + sep.join(parts) + ("" if depth else "\n") + "}"
